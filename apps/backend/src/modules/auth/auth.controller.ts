import {
  Controller,
  Post,
  Patch,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/register
   * Registrar un nuevo usuario
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  /**
   * POST /api/auth/login
   * Iniciar sesión
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  /**
   * GET /api/auth/profile
   * Obtener perfil del usuario autenticado (protegido con JWT)
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return {
      user: req.user,
    };
  }

  /**
   * PATCH /api/auth/profile
   * Actualizar datos de perfil (nombre, email, telefono, provincia, localidad)
   * El DNI no se puede modificar
   */
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.userId, dto);
  }

  /**
   * POST /api/auth/change-password
   * Cambiar contraseña del usuario autenticado
   */
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.userId, dto);
  }

  /**
   * GET /api/auth/test
   * Endpoint de prueba para verificar que el módulo está funcionando
   */
  @Get('test')
  test() {
    return {
      message: 'Auth module is working!',
      timestamp: new Date().toISOString(),
    };
  }
}
