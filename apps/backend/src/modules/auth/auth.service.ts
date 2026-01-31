import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

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
    const { email, password, nombre, telefono, provincia, localidad } =
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
