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
import { BondaService } from '../bonda/bonda.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly bondaService: BondaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registrar un nuevo usuario
   * 1. Valida que el email no exista
   * 2. Genera código de afiliado único
   * 3. Hashea la contraseña
   * 4. Crea usuario en Supabase
   * 5. Crea afiliado en Bonda
   * 6. Actualiza estado de sincronización
   * 7. Genera JWT
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, nombre, telefono, provincia, localidad } =
      registerDto;

    // 1. Verificar si el usuario ya existe
    const existingUser = await this.supabaseService.findUserByEmail(email);
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // 2. Generar código de afiliado único
    const bondaCode = this.generarCodigoAfiliado(email);

    // 3. Hashear contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Crear usuario en Supabase
    let usuario;
    try {
      usuario = await this.supabaseService.createUser({
        nombre,
        email,
        telefono,
        provincia,
        localidad,
        password_hash: passwordHash,
        bonda_affiliate_code: bondaCode,
      });
    } catch (error) {
      this.logger.error('Error al crear usuario en Supabase:', error);
      throw new InternalServerErrorException('Error al crear usuario');
    }

    // 5. Crear afiliado en Bonda (asíncrono, no bloquea el registro)
    this.sincronizarConBonda(usuario.id, bondaCode, registerDto).catch(
      (error) => {
        this.logger.error('Error en sincronización con Bonda:', error);
      },
    );

    // 6. Generar JWT
    const token = this.generarToken(usuario);

    this.logger.log(`✅ Usuario registrado: ${email}`);

    return {
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        bondaCode: usuario.bonda_affiliate_code,
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
        bondaCode: usuario.bonda_affiliate_code,
      },
      token,
    };
  }

  /**
   * Generar código de afiliado único
   * Formato: {emailPart}_{timestamp}{random}
   * Ejemplo: juan_xy7k2p3
   */
  private generarCodigoAfiliado(email: string): string {
    const emailPart = email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 5);

    const timestamp = Date.now().toString(36).substring(-5);
    const random = Math.random().toString(36).substring(2, 5);

    return `${emailPart}_${timestamp}${random}`;
  }

  /**
   * Generar token JWT
   */
  private generarToken(usuario: any): string {
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      bondaCode: usuario.bonda_affiliate_code,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Sincronizar usuario con Bonda
   * Esta función se ejecuta de forma asíncrona después del registro
   */
  private async sincronizarConBonda(
    usuarioId: string,
    bondaCode: string,
    data: RegisterDto,
  ): Promise<void> {
    try {
      // Crear afiliado en Bonda
      const bondaResponse = await this.bondaService.crearAfiliado({
        code: bondaCode,
        email: data.email,
        nombre: data.nombre,
        telefono: data.telefono,
        provincia: data.provincia,
        localidad: data.localidad,
      });

      // Actualizar estado de sincronización
      if (bondaResponse.success) {
        await this.supabaseService.updateBondaSyncStatus(usuarioId, 'synced');
        this.logger.log(`✅ Usuario sincronizado con Bonda: ${bondaCode}`);
      } else {
        await this.supabaseService.updateBondaSyncStatus(usuarioId, 'error');
        this.logger.error('Error en respuesta de Bonda:', bondaResponse.error);
      }

      // Registrar log de la operación
      await this.supabaseService.logBondaOperation({
        usuario_id: usuarioId,
        operacion: 'create',
        endpoint: '/affiliates',
        request_data: { code: bondaCode, email: data.email },
        response_data: bondaResponse,
        exitoso: bondaResponse.success || false,
        error_message: bondaResponse.error?.code,
      });
    } catch (error) {
      this.logger.error('Error al sincronizar con Bonda:', error);
      await this.supabaseService.updateBondaSyncStatus(usuarioId, 'error');

      // Registrar error en logs
      await this.supabaseService.logBondaOperation({
        usuario_id: usuarioId,
        operacion: 'create',
        endpoint: '/affiliates',
        request_data: { code: bondaCode },
        response_data: null,
        exitoso: false,
        error_message: error.message,
      });
    }
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
