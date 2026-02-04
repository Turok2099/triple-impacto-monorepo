import { Controller, Get, Post, Query, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SyncCuponesService } from './sync-cupones.service';
import { ConfigService } from '@nestjs/config';
import { BondaService } from '../bonda/bonda.service';

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
  // Hardcodear configuración de Fundación Padres para cupones públicos
  private readonly FUNDACION_PADRES_CONFIG = {
    slug: 'beneficios-fundacion-padres',
    micrositeId: '911299',
    apiToken: 'DG7xN1fp5wmr60YnPizhhEbYCT4ivTOiVDYoLXdKEn9Zhb1nipHIJEDHuyn69bWq',
    codigoAfiliado: '22380612', // Código demo para consultas públicas
  };

  constructor(
    private readonly supabase: SupabaseService,
    private readonly syncCuponesService: SyncCuponesService,
    private readonly configService: ConfigService,
    private readonly bondaService: BondaService,
  ) {}

  /**
   * Catálogo público de cupones (Estado 1 – Visitantes).
   * No requiere autenticación. Se muestran en la landing sin códigos.
   * Soporta filtros opcionales: categoria, orderBy
   */
  @Get('cupones')
  async getCupones(
    @Query('categoria') categoria?: string,
    @Query('orderBy') orderBy?: string,
  ): Promise<PublicCouponDto[]> {
    // Si hay filtros, llamar directamente a Bonda (futuro)
    // Por ahora, retornamos de la tabla local public_coupons
    // TODO: Implementar filtrado desde Bonda en tiempo real si se requiere
    return this.supabase.getPublicCoupons();
  }

  /**
   * Obtiene las categorías disponibles de cupones.
   * GET /api/public/categorias
   */
  @Get('categorias')
  async getCategorias(): Promise<
    { id: number; nombre: string; parent_id?: number | null }[]
  > {
    // Retornar categorías hardcodeadas o desde Supabase
    // Por ahora, retornamos las categorías más comunes
    return [
      { id: 0, nombre: 'Todos' },
      { id: 12, nombre: 'Gastronomía' },
      { id: 11, nombre: 'Turismo' },
      { id: 13, nombre: 'Compras' },
      { id: 7, nombre: 'Belleza y Salud' },
      { id: 6, nombre: 'Indumentaria y Moda' },
      { id: 8, nombre: 'Servicios' },
    ];
  }

  /**
   * Obtiene cupones directamente desde Bonda API con filtros.
   * GET /api/public/cupones-bonda
   * 
   * Query params:
   * - categoria: ID de categoría (opcional)
   * - orderBy: relevant | latest (opcional, default: relevant)
   * 
   * Este endpoint llama directamente a Bonda (micrositio Fundación Padres)
   * sin pasar por la tabla public_coupons de Supabase.
   * Retorna todos los cupones disponibles (1600+) con filtros aplicados.
   */
  @Get('cupones-bonda')
  async getCuponesDesdeBonda(
    @Query('categoria') categoria?: string,
    @Query('orderBy') orderBy?: string,
  ): Promise<any> {
    try {
      const response = await this.bondaService.obtenerCupones(
        this.FUNDACION_PADRES_CONFIG.codigoAfiliado,
        {
          slug: this.FUNDACION_PADRES_CONFIG.slug,
          categoria: categoria ? Number(categoria) : undefined,
          orderBy: orderBy as 'latest' | 'relevant' | 'ownRelevant',
          subcategories: true,
        },
      );

      // Transformar a formato público (sin códigos sensibles)
      return {
        count: response.count,
        cupones: response.cupones.map((cupon) => ({
          id: cupon.id,
          nombre: cupon.nombre,
          descuento: cupon.descuento,
          empresa: cupon.empresa.nombre,
          imagen_url:
            cupon.imagenes.principal?.['280x190'] ||
            cupon.imagenes.thumbnail?.['90x90'] ||
            null,
          logo_empresa:
            cupon.empresa.logoThumbnail?.['90x90'] || null,
        })),
      };
    } catch (error) {
      throw error;
    }
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
