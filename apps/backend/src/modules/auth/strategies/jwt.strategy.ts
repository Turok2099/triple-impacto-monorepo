import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('jwt.secret') || 'default-secret-key',
    });
  }

  async validate(payload: any) {
    const user = await this.authService.validateUser(payload.sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      userId: payload.sub,
      id: user.id,
      nombre: user.nombre,
      email: payload.email,
      bondaCode: payload.bondaCode,
      telefono: user.telefono ?? null,
      dni: user.dni ?? null,
      provincia: user.provincia ?? null,
      localidad: user.localidad ?? null,
      role: user.role || payload.app_metadata?.role || 'user',
      avatar_url: user.avatar_url ?? null,
    };
  }
}
