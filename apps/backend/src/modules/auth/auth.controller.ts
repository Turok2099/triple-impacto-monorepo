import {
  Controller,
  Post,
  Patch,
  Body,
  Get,
  Query,
  Res,
  UseGuards,
  Request,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
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
   * GET /api/auth/verify-email
   * Verificar correo electrónico con token
   */
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    try {
      await this.authService.verifyEmail(token);
      // Tras validar, redirigimos al login del FRONTEND con mensaje de éxito
      return res.redirect('http://localhost:3001/login?verified=true');
    } catch (err) {
      // Si falla, redirigimos con parámetro de error
      return res.redirect('http://localhost:3001/login?error=invalid_token');
    }
  }

  /**
   * POST /api/auth/resend-verification
   * Reenviar correo de verificación
   */
  @Post('resend-verification')
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
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
   * POST /api/auth/forgot-password
   * Solicitar recuperación de contraseña
   */
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  /**
   * POST /api/auth/reset-password
   * Configurar nueva contraseña mediante token seguro
   */
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
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
