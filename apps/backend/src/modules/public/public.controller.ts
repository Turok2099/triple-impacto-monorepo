import { Controller, Get, Post, Query, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SyncCuponesService } from './sync-cupones.service';
import { ConfigService } from '@nestjs/config';

/** Cupón público para el catálogo de visitantes (sin códigos). */
export interface PublicCouponDto {
  id: string;
  titulo: string;
  descripcion: string | null;
  descuento: string | null;
  imagen_url: string | null;
  empresa: string | null;
  categoria: string | null;
  orden: number;
  activo: boolean;
  created_at: string;
}

/** Organización con monto_minimo y monto_sugerido para donaciones. */
export interface OrganizacionPublicDto {
  id: string;
  nombre: string;
  descripcion: string | null;
  logo_url: string | null;
  website_url: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  monto_minimo: number | null;
  monto_sugerido: number | null;
  activa: boolean;
  verificada: boolean;
  created_at: string;
  updated_at: string;
}

@Controller('public')
export class PublicController {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly syncCuponesService: SyncCuponesService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Catálogo público de cupones (Estado 1 – Visitantes).
   * No requiere autenticación. Se muestran en la landing sin códigos.
   */
  @Get('cupones')
  async getCupones(): Promise<PublicCouponDto[]> {
    return this.supabase.getPublicCoupons();
  }

  /**
   * Organizaciones activas con monto_minimo y monto_sugerido.
   * Para que el front obtenga montos por ONG (donaciones).
   */
  @Get('organizaciones')
  async getOrganizaciones(): Promise<OrganizacionPublicDto[]> {
    return this.supabase.getOrganizacionesActivas();
  }

  /**
   * Trigger manual para sincronizar cupones de Bonda a public_coupons.
   * Requiere un secret para evitar abusos.
   * POST /api/public/sync-cupones?secret=TU_SECRET
   * 
   * Ejemplo:
   * curl -X POST "http://localhost:3000/api/public/sync-cupones?secret=dev-secret-change-in-production"
   */
  @Post('sync-cupones')
  async syncCupones(@Query('secret') secret: string) {
    // Validar secret (puede configurarse en .env)
    const expectedSecret =
      this.configService.get<string>('SYNC_SECRET') ||
      'dev-secret-change-in-production';

    if (secret !== expectedSecret) {
      throw new UnauthorizedException('Invalid secret for sync operation');
    }

    await this.syncCuponesService.syncManual();

    return {
      success: true,
      message: 'Sync de cupones ejecutado exitosamente',
      timestamp: new Date().toISOString(),
    };
  }
}
