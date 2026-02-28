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
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly jwtService: JwtService,
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
    const { email, password, nombre, telefono, dni, provincia, localidad } =
      registerDto;

    // 1. Verificar si el usuario ya existe
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

    // 4. Generar JWT
    const token = this.generarToken(usuario);

    this.logger.log(`✅ Usuario registrado: ${email}`);

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
      },
      token,
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

    // 2. Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 3. Generar JWT
    const token = this.generarToken(usuario);

    this.logger.log(`✅ Login exitoso: ${email}`);

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
      },
      token,
    };
  }

  /**
   * Generar token JWT
   */
  private generarToken(usuario: any): string {
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      bondaCode: usuario.bonda_affiliate_code ?? null,
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

    const passwordMatch = await bcrypt.compare(dto.passwordActual, usuario.password_hash);
    if (!passwordMatch) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    if (dto.passwordActual === dto.passwordNueva) {
      throw new BadRequestException('La nueva contraseña debe ser diferente a la actual');
    }

    const saltRounds = 10;
    const newHash = await bcrypt.hash(dto.passwordNueva, saltRounds);
    await this.supabaseService.updateUserPassword(userId, newHash);

    this.logger.log(`✅ Contraseña actualizada para usuario: ${usuario.email}`);

    return { success: true, message: 'Contraseña actualizada exitosamente' };
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
