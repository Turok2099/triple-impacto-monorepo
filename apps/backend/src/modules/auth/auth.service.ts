import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { MailService } from '../mail/mail.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { NewsletterService } from '../newsletter/newsletter.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly newsletterService: NewsletterService,
  ) {}

  /**
   * Registrar un nuevo usuario.
   * El afiliado en Bonda se crea tras la confirmación del primer pago (webhook Fiserv), no aquí.
   * 1. Valida que el email no exista
   * 2. Hashea la contraseña
   * 3. Crea usuario en Supabase (sin bonda_affiliate_code)
   * 4. Genera JWT
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, nombre, telefono, dni, provincia, localidad, acceptsNewsletter } =
      registerDto;

    // 1. Verificar si el DNI ya existe (si es que enviaron uno)
    if (dni) {
      const existingDni = await this.supabaseService.findUserByDni(dni);
      if (existingDni) {
        throw new BadRequestException(
          'El DNI ya se encuentra registrado por otro usuario',
        );
      }
    }

    // 2. Verificar si el email ya existe
    const existingUser = await this.supabaseService.findUserByEmail(email);
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // 2. Hashear contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Crear usuario en Supabase (sin bonda_affiliate_code; se asigna tras el primer pago Fiserv)
    let usuario;
    try {
      usuario = await this.supabaseService.createUser({
        nombre,
        email,
        telefono,
        dni,
        provincia,
        localidad,
        password_hash: passwordHash,
      });
    } catch (error) {
      this.logger.error('Error al crear usuario en Supabase:', error);
      throw new InternalServerErrorException('Error al crear usuario');
    }

    // 4. Enviar correo de bienvenida/verificación (fire-and-forget)
    // Usamos el token autogenerado por Supabase en la columna email_verification_token
    const verificationToken = usuario.email_verification_token;
    if (verificationToken) {
      this.mailService.sendVerificationEmail(email, nombre, verificationToken).catch((err) => {
        this.logger.error('Fallo no crítico: no se pudo enviar correo de bienvenida', err);
      });
    } else {
      this.logger.warn(`No se encontró token de verificación para ${email}`);
    }

    // 5. Suscribir al newsletter si aceptó
    if (acceptsNewsletter) {
      this.newsletterService.subscribe({ email }).catch(err => {
        this.logger.error(`Fallo no crítico: no se pudo suscribir al newsletter a ${email}`, err);
      });
    }

    return {
      message: 'Revisa tu bandeja de entrada para verificar tu cuenta.',
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        bondaCode: usuario.bonda_affiliate_code ?? null,
        telefono: usuario.telefono ?? null,
        dni: usuario.dni ?? null,
        provincia: usuario.provincia ?? null,
        localidad: usuario.localidad ?? null,
        role: 'user', // Predeterminado al registrarse
      },
      token: '', // No devolvemos JWT hasta que se loguee verificado
    };
  }

  /**
   * Iniciar sesión
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // 1. Buscar usuario por email
    const usuario = await this.supabaseService.findUserByEmail(email);
    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. Verificar si está verificado el correo electrónico
    if (usuario.is_email_verified === false) {
      throw new UnauthorizedException('Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.');
    }

    // 3. Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 3. Generar JWT recuperando el rol de Supabase Auth
    const role = await this.supabaseService.getUserRole(usuario.id);
    const token = this.generarToken(usuario, role);

    this.logger.log(`✅ Login exitoso: ${email} (Role: ${role})`);

    return {
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        bondaCode: usuario.bonda_affiliate_code ?? null,
        telefono: usuario.telefono ?? null,
        dni: usuario.dni ?? null,
        provincia: usuario.provincia ?? null,
        localidad: usuario.localidad ?? null,
        role,
        avatar_url: usuario.avatar_url ?? null,
      },
      token,
    };
  }

  /**
   * Verificar correo electrónico usando un Token
   */
  async verifyEmail(token: string): Promise<boolean> {
    const { data: usuario, error: findError } = await this.supabaseService
      .from('usuarios')
      .select('id, is_email_verified')
      .eq('email_verification_token', token)
      .single();

    if (findError || !usuario) {
      throw new BadRequestException('Token de verificación inválido o expirado.');
    }

    if (usuario.is_email_verified) {
      return true; // Ya estaba verificado
    }

    const { error: updateError } = await this.supabaseService
      .from('usuarios')
      .update({
        is_email_verified: true,
        email_verification_token: null,
      })
      .eq('id', usuario.id);

    if (updateError) {
      this.logger.error('Error al actualizar verificación de correo:', updateError);
      throw new InternalServerErrorException('No se pudo verificar la cuenta.');
    }

    this.logger.log(`✅ Cuenta verificada: usuario ID ${usuario.id}`);
    return true;
  }

  /**
   * Reenviar correo de verificación
   */
  async resendVerification(dto: ResendVerificationDto): Promise<{ message: string }> {
    const { email } = dto;
    const usuario = await this.supabaseService.findUserByEmail(email);

    // Retorna éxito encubierto para no permitir enumeración de cuentas
    if (!usuario) {
      this.logger.warn(`resendVerification solicitado para correo inexistente: ${email}`);
      return { message: 'Si tu cuenta existe y no está verificada, te hemos enviado un nuevo enlace.' };
    }

    if (usuario.is_email_verified) {
      throw new BadRequestException('Esta cuenta ya ha sido verificada.');
    }

    // Generar nuevo token
    const newVerificationToken = crypto.randomUUID();

    const { error: updateError } = await this.supabaseService
      .from('usuarios')
      .update({
        email_verification_token: newVerificationToken,
      })
      .eq('id', usuario.id);

    if (updateError) {
      this.logger.error('Error al generar nuevo token de verificación:', updateError);
      throw new InternalServerErrorException('No se pudo procesar tu solicitud.');
    }

    // Enviar correo
    this.mailService.sendVerificationEmail(email, usuario.nombre, newVerificationToken).catch((err) => {
      this.logger.error('Fallo no crítico al reenviar correo de bienvenida', err);
    });

    return { message: 'Si tu cuenta existe y no está verificada, te hemos enviado un nuevo enlace.' };
  }

  /**
   * Solicitar recuperación de contraseña
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = dto;
    const usuario = await this.supabaseService.findUserByEmail(email);

    // Retorna éxito encubierto para no permitir enumeración de cuentas
    if (!usuario) {
      this.logger.warn(`forgotPassword solicitado para correo inexistente: ${email}`);
      return { message: 'Si el correo existe en nuestra base de datos, te hemos enviado un enlace de recuperación.' };
    }

    // Generar token UUID y Fecha de Expiración (1 hora)
    const resetToken = crypto.randomUUID();
    const expiresInHs = new Date();
    expiresInHs.setHours(expiresInHs.getHours() + 1);

    const { error: updateError } = await this.supabaseService
      .from('usuarios')
      .update({
        password_reset_token: resetToken,
        password_reset_expires: expiresInHs.toISOString(),
      })
      .eq('id', usuario.id);

    if (updateError) {
      this.logger.error('Error al guardar token de reseteo:', updateError);
      throw new InternalServerErrorException('No se pudo procesar la solicitud.');
    }

    // Enviar correo electrónico
    this.mailService.sendPasswordResetEmail(email, usuario.nombre, resetToken).catch((err) => {
      this.logger.error('Fallo no crítico al enviar correo de reseteo', err);
    });

    return { message: 'Si el correo existe en nuestra base de datos, te hemos enviado un enlace de recuperación.' };
  }

  /**
   * Confirmar la nueva contraseña mediante Token
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = dto;

    const { data: usuario, error: findError } = await this.supabaseService
      .from('usuarios')
      .select('id, password_reset_expires')
      .eq('password_reset_token', token)
      .single();

    if (findError || !usuario) {
      throw new BadRequestException('El enlace es inválido o el usuario no existe.');
    }

    // Validar expiración (Timestamptz vs Date.now)
    const expiresAt = new Date(usuario.password_reset_expires).getTime();
    if (expiresAt < Date.now()) {
      throw new BadRequestException('Este enlace ha caducado. Solicita uno nuevo.');
    }

    // Hashear y guardar nueva clave limpiando tokens
    const saltRounds = 10;
    const newHash = await bcrypt.hash(newPassword, saltRounds);

    const { error: updateError } = await this.supabaseService
      .from('usuarios')
      .update({
        password_hash: newHash,
        password_reset_token: null,
        password_reset_expires: null,
      })
      .eq('id', usuario.id);

    if (updateError) {
      this.logger.error('Error al actualizar la contraseña del usuario:', updateError);
      throw new InternalServerErrorException('Hubo un problema actualizando la contraseña.');
    }

    this.logger.log(`✅ Contraseña restablaciada con token: usuario ID ${usuario.id}`);
    return { message: 'Tu contraseña ha sido actualizada con éxito.' };
  }

  /**
   * Generar token JWT
   */
  private generarToken(usuario: any, role: string = 'user'): string {
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      bondaCode: usuario.bonda_affiliate_code ?? null,
      app_metadata: { role }
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Actualizar perfil del usuario (nombre, email, telefono, provincia, localidad)
   * El DNI no se puede modificar una vez registrado
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // Si quiere cambiar email, verificar que no esté en uso por otro usuario
    if (dto.email) {
      const existing = await this.supabaseService.findUserByEmail(dto.email);
      if (existing && existing.id !== userId) {
        throw new ConflictException('El email ya está en uso por otra cuenta');
      }
    }

    // Si viene DNI (a través de algún bypass, aunque no deberia cambiar), verificar duplicidad
    if ((dto as any).dni) {
      const existingDni = await this.supabaseService.findUserByDni(
        (dto as any).dni,
      );
      if (existingDni && existingDni.id !== userId) {
        throw new BadRequestException(
          'El DNI ya se encuentra registrado por otro usuario',
        );
      }
    }

    const updated = await this.supabaseService.updateUserProfile(userId, dto);

    this.logger.log(`✅ Perfil actualizado: ${updated.email}`);

    return {
      id: updated.id,
      nombre: updated.nombre,
      email: updated.email,
      telefono: updated.telefono ?? null,
      dni: updated.dni ?? null,
      provincia: updated.provincia ?? null,
      localidad: updated.localidad ?? null,
      avatar_url: updated.avatar_url ?? null,
    };
  }

  /**
   * Cambiar contraseña del usuario
   * Verifica la contraseña actual antes de actualizar
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const usuario = await this.supabaseService.findUserById(userId);
    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const passwordMatch = await bcrypt.compare(
      dto.passwordActual,
      usuario.password_hash,
    );
    if (!passwordMatch) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    if (dto.passwordActual === dto.passwordNueva) {
      throw new BadRequestException(
        'La nueva contraseña debe ser diferente a la actual',
      );
    }

    const saltRounds = 10;
    const newHash = await bcrypt.hash(dto.passwordNueva, saltRounds);
    await this.supabaseService.updateUserPassword(userId, newHash);

    this.logger.log(`✅ Contraseña actualizada para usuario: ${usuario.email}`);

    return { success: true, message: 'Contraseña actualizada exitosamente' };
  }

  /**
   * Subir foto de perfil a Supabase
   */
  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }
    const publicUrl = await this.supabaseService.uploadAvatar(userId, file.buffer, file.mimetype, file.originalname);
    
    this.logger.log(`✅ Foto de perfil actualizada para usuario ID: ${userId}`);
    return { success: true, avatar_url: publicUrl };
  }

  /**
   * Validar usuario por ID (para guards)
   */
  async validateUser(userId: string): Promise<any> {
    const usuario = await this.supabaseService
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single();

    if (!usuario.data) {
      return null;
    }

    return usuario.data;
  }
}
