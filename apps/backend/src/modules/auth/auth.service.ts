import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
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
import { SsoSyncDto } from './dto/sso-sync.dto';
import { NewsletterService } from '../newsletter/newsletter.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
    const {
      email,
      password,
      nombre,
      telefono,
      dni,
      provincia,
      localidad,
      acceptsNewsletter,
    } = registerDto;

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
      this.mailService
        .sendVerificationEmail(email, nombre, verificationToken)
        .catch((err) => {
          this.logger.error(
            'Fallo no crítico: no se pudo enviar correo de bienvenida',
            err,
          );
        });
    } else {
      this.logger.warn(`No se encontró token de verificación para ${email}`);
    }

    // 5. Suscribir al newsletter si aceptó
    if (acceptsNewsletter) {
      this.newsletterService.subscribe({ email }).catch((err) => {
        this.logger.error(
          `Fallo no crítico: no se pudo suscribir al newsletter a ${email}`,
          err,
        );
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
      throw new UnauthorizedException(
        'Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.',
      );
    }

    // 3. Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 3. Generar JWT recuperando el rol de Supabase Auth
    const role = await this.supabaseService.getUserRole(usuario.id);
    const { token, refreshToken } = await this.emitirTokens(usuario, role);

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
      refreshToken,
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
      throw new BadRequestException(
        'Token de verificación inválido o expirado.',
      );
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
      this.logger.error(
        'Error al actualizar verificación de correo:',
        updateError,
      );
      throw new InternalServerErrorException('No se pudo verificar la cuenta.');
    }

    this.logger.log(`✅ Cuenta verificada: usuario ID ${usuario.id}`);
    return true;
  }

  /**
   * Reenviar correo de verificación
   */
  async resendVerification(
    dto: ResendVerificationDto,
  ): Promise<{ message: string }> {
    const { email } = dto;
    const usuario = await this.supabaseService.findUserByEmail(email);

    // Retorna éxito encubierto para no permitir enumeración de cuentas
    if (!usuario) {
      this.logger.warn(
        `resendVerification solicitado para correo inexistente: ${email}`,
      );
      return {
        message:
          'Si tu cuenta existe y no está verificada, te hemos enviado un nuevo enlace.',
      };
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
      this.logger.error(
        'Error al generar nuevo token de verificación:',
        updateError,
      );
      throw new InternalServerErrorException(
        'No se pudo procesar tu solicitud.',
      );
    }

    // Enviar correo
    this.mailService
      .sendVerificationEmail(email, usuario.nombre, newVerificationToken)
      .catch((err) => {
        this.logger.error(
          'Fallo no crítico al reenviar correo de bienvenida',
          err,
        );
      });

    return {
      message:
        'Si tu cuenta existe y no está verificada, te hemos enviado un nuevo enlace.',
    };
  }

  /**
   * Solicitar recuperación de contraseña
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = dto;
    const usuario = await this.supabaseService.findUserByEmail(email);

    // Retorna éxito encubierto para no permitir enumeración de cuentas
    if (!usuario) {
      this.logger.warn(
        `forgotPassword solicitado para correo inexistente: ${email}`,
      );
      return {
        message:
          'Si el correo existe en nuestra base de datos, te hemos enviado un enlace de recuperación.',
      };
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
      throw new InternalServerErrorException(
        'No se pudo procesar la solicitud.',
      );
    }

    // Enviar correo electrónico
    this.mailService
      .sendPasswordResetEmail(email, usuario.nombre, resetToken)
      .catch((err) => {
        this.logger.error('Fallo no crítico al enviar correo de reseteo', err);
      });

    return {
      message:
        'Si el correo existe en nuestra base de datos, te hemos enviado un enlace de recuperación.',
    };
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
      throw new BadRequestException(
        'El enlace es inválido o el usuario no existe.',
      );
    }

    // Validar expiración (Timestamptz vs Date.now)
    const expiresAt = new Date(usuario.password_reset_expires).getTime();
    if (expiresAt < Date.now()) {
      throw new BadRequestException(
        'Este enlace ha caducado. Solicita uno nuevo.',
      );
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
      this.logger.error(
        'Error al actualizar la contraseña del usuario:',
        updateError,
      );
      throw new InternalServerErrorException(
        'Hubo un problema actualizando la contraseña.',
      );
    }

    this.logger.log(
      `✅ Contraseña restablaciada con token: usuario ID ${usuario.id}`,
    );
    return { message: 'Tu contraseña ha sido actualizada con éxito.' };
  }

  /**
   * Generar token JWT (access token, corta duración)
   */
  private generarToken(usuario: any, role: string = 'user'): string {
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      bondaCode: usuario.bonda_affiliate_code ?? null,
      app_metadata: { role },
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Generar refresh token (larga duración, secreto propio) y persistir su hash
   * para poder revocarlo server-side (logout, rotación).
   */
  private generarRefreshToken(usuario: any): string {
    const payload = { sub: usuario.id, type: 'refresh' as const };
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') as any,
    });
  }

  /**
   * Emitir el par access/refresh token de una vez y guardar el hash del
   * refresh token en la fila del usuario.
   */
  private async emitirTokens(
    usuario: any,
    role: string,
  ): Promise<{ token: string; refreshToken: string }> {
    const token = this.generarToken(usuario, role);
    const refreshToken = this.generarRefreshToken(usuario);
    await this.guardarRefreshToken(usuario.id, refreshToken);
    return { token, refreshToken };
  }

  private async guardarRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresInMs = this.parseDuracionAMs(
      this.configService.get<string>('jwt.refreshExpiresIn') || '7d',
    );
    const refreshTokenExpires = new Date(Date.now() + expiresInMs);

    const { error } = await this.supabaseService
      .from('usuarios')
      .update({
        refresh_token_hash: refreshTokenHash,
        refresh_token_expires: refreshTokenExpires.toISOString(),
      })
      .eq('id', userId);

    if (error) {
      this.logger.error('Error al guardar refresh token:', error);
      throw new InternalServerErrorException(
        'No se pudo iniciar la sesión. Intentá de nuevo.',
      );
    }
  }

  /** Convierte strings tipo '7d', '30m', '12h' a milisegundos. */
  private parseDuracionAMs(duracion: string): number {
    const match = /^(\d+)([smhd])$/.exec(duracion.trim());
    if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 días
    const valor = parseInt(match[1], 10);
    const unidad = match[2];
    const multiplicadores: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return valor * multiplicadores[unidad];
  }

  /**
   * Canjear un refresh token vigente por un access token nuevo, rotando
   * también el refresh token (se invalida el anterior).
   */
  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ token: string; refreshToken: string }> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token requerido');
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    if (payload.type !== 'refresh' || !payload.sub) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const usuario = await this.validateUser(payload.sub);
    if (!usuario || !usuario.refresh_token_hash) {
      throw new UnauthorizedException('Sesión inválida, iniciá sesión de nuevo');
    }

    if (
      usuario.refresh_token_expires &&
      new Date(usuario.refresh_token_expires) < new Date()
    ) {
      throw new UnauthorizedException('La sesión expiró, iniciá sesión de nuevo');
    }

    const matches = await bcrypt.compare(
      refreshToken,
      usuario.refresh_token_hash,
    );
    if (!matches) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const role = await this.supabaseService.getUserRole(usuario.id);
    return this.emitirTokens(usuario, role);
  }

  /**
   * Cerrar sesión: revoca el refresh token guardado para que no pueda
   * volver a usarse aunque no haya expirado todavía.
   */
  async logout(userId: string): Promise<{ message: string }> {
    const { error } = await this.supabaseService
      .from('usuarios')
      .update({
        refresh_token_hash: null,
        refresh_token_expires: null,
      })
      .eq('id', userId);

    if (error) {
      this.logger.error('Error al cerrar sesión:', error);
      throw new InternalServerErrorException('No se pudo cerrar la sesión.');
    }

    return { message: 'Sesión cerrada correctamente.' };
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
    const publicUrl = await this.supabaseService.uploadAvatar(
      userId,
      file.buffer,
      file.mimetype,
      file.originalname,
    );

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

  /**
   * Sincronizar usuario de SSO (Google) asegurando que exista en public.usuarios.
   */
  async ssoSync(token: string, dto: SsoSyncDto) {
    // 1. Obtener usuario desde Supabase con el token JWT del frontend
    const { data: authData, error: authError } = await this.supabaseService
      .getClient()
      .auth.getUser(token);

    if (authError || !authData.user) {
      this.logger.error('Error al validar token de SSO:', authError);
      throw new UnauthorizedException('Token de sesión inválido');
    }

    const authUser = authData.user;
    const { dni, telefono, provincia, localidad } = dto;

    // Verificar si el DNI ya está en uso por otro usuario (solo si se envió uno)
    if (dni) {
      const existingDni = await this.supabaseService.findUserByDni(dni);
      if (existingDni && existingDni.id !== authUser.id) {
        throw new BadRequestException(
          'El DNI ya se encuentra registrado por otro usuario',
        );
      }
    }

    // 2. Comprobar si ya existe en public.usuarios
    let publicUser = await this.supabaseService.findUserById(authUser.id);
    const userMetadata = authUser.user_metadata || {};

    if (!publicUser) {
      if (!dni) {
        // Usuario nuevo de Google sin DNI todavía: no podemos crear el perfil
        // (el DNI es obligatorio). El frontend debe pedirlo en /completar-perfil
        // y volver a llamar a este endpoint con el dato.
        return {
          success: true,
          token: null,
          user: {
            id: authUser.id,
            nombre: userMetadata.full_name || userMetadata.name || 'Usuario',
            email: authUser.email,
            bondaCode: null,
            telefono: null,
            dni: null,
            provincia: null,
            localidad: null,
            avatar_url: userMetadata.avatar_url || userMetadata.picture || null,
            role: 'user',
          },
        };
      }

      // Si no existe y ya tenemos DNI, crearlo.
      try {
        const result = await this.supabaseService
          .getClient()
          .from('usuarios')
          .insert({
            id: authUser.id,
            email: authUser.email,
            nombre: userMetadata.full_name || userMetadata.name || 'Usuario',
            dni,
            telefono,
            provincia,
            localidad,
            is_email_verified: true,
            avatar_url: userMetadata.avatar_url || userMetadata.picture || null,
          })
          .select()
          .single();

        if (result.error) throw result.error;
        publicUser = result.data;
      } catch (err) {
        this.logger.error(
          'Error al insertar usuario SSO en public.usuarios:',
          err,
        );
        throw new InternalServerErrorException(
          'Error al sincronizar el perfil',
        );
      }
    } else if (dni || telefono || provincia || localidad) {
      // Si existe y llegaron datos nuevos, actualizar solo lo enviado
      try {
        const updateData: any = {};
        if (dni) updateData.dni = dni;
        if (telefono) updateData.telefono = telefono;
        if (provincia) updateData.provincia = provincia;
        if (localidad) updateData.localidad = localidad;

        publicUser = await this.supabaseService.updateUserProfile(
          authUser.id,
          updateData,
        );
      } catch (err) {
        this.logger.error(
          'Error al actualizar usuario SSO en public.usuarios:',
          err,
        );
        throw new InternalServerErrorException('Error al actualizar el perfil');
      }
    }

    // 3. Emitir el JWT propio del backend (no el token de Supabase) y devolver el perfil
    const role = await this.supabaseService.getUserRole(authUser.id);
    const { token: appToken, refreshToken } = await this.emitirTokens(
      publicUser,
      role,
    );

    return {
      success: true,
      token: appToken,
      refreshToken,
      user: {
        id: publicUser.id,
        nombre: publicUser.nombre,
        email: publicUser.email,
        bondaCode: publicUser.bonda_affiliate_code ?? null,
        telefono: publicUser.telefono ?? null,
        dni: publicUser.dni ?? null,
        provincia: publicUser.provincia ?? null,
        localidad: publicUser.localidad ?? null,
        avatar_url: publicUser.avatar_url ?? null,
        role,
      },
    };
  }
}
