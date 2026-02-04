import {
  Controller,
  Get,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
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
    apiToken:
      'DG7xN1fp5wmr60YnPizhhEbYCT4ivTOiVDYoLXdKEn9Zhb1nipHIJEDHuyn69bWq',
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
   * Obtiene las categorías disponibles de cupones (hardcodeadas, compatibles con UI).
   * GET /api/public/categorias
   */
  @Get('categorias')
  async getCategorias(): Promise<
    { id: number; nombre: string; parent_id?: number | null }[]
  > {
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

  /** Lista exacta de filtros a mostrar (mismo orden que web Bonda). Se mapean a IDs de la API. */
  private readonly FILTROS_LABELS = [
    'Compras',
    'Gastronomía',
    'Indumentaria, Calzado y Moda',
    'Educación',
    'Servicios',
    'Turismo',
    'Gimnasios y Deportes',
    'Belleza y Salud',
    'Entretenimientos',
    'Motos',
    'Teatros',
    'Autos',
    'Cines',
    'Inmobiliarias',
    'Inmuebles',
  ] as const;

  /** Aliases para matchear nombres que Bonda puede devolver con otro texto. */
  private readonly FILTROS_ALIASES: Record<string, string[]> = {
    'Indumentaria, Calzado y Moda': ['Indumentaria y Moda', 'Indumentaria'],
  };

  /** Normaliza nombre para comparar con respuestas de Bonda (minúsculas, sin acentos, trim). */
  private normalizarNombre(n: string): string {
    return (n || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\u0300-\u036f/g, '');
  }

  /**
   * Categorías para el filtro: misma lista que web Bonda, con IDs del endpoint Categorias.
   * GET /api/public/categorias-bonda
   * Se obtienen categorías/subcategorías de Bonda y se mapean a estos labels; el filtro
   * de cupones usa el param "categoria" (Integer) según la API "Listado de cupones filtrados".
   */
  /** Lista completa de subcategorías para el filtro (IDs compatibles con Bonda). */
  private readonly CATEGORIAS_FALLBACK = [
    { id: 0, nombre: 'Todo' },
    { id: 13, nombre: 'Compras' },
    { id: 12, nombre: 'Gastronomía' },
    { id: 6, nombre: 'Indumentaria, Calzado y Moda' },
    { id: 14, nombre: 'Educación' },
    { id: 8, nombre: 'Servicios' },
    { id: 11, nombre: 'Turismo' },
    { id: 16, nombre: 'Gimnasios y Deportes' },
    { id: 7, nombre: 'Belleza y Salud' },
    { id: 17, nombre: 'Entretenimientos' },
    { id: 18, nombre: 'Motos' },
    { id: 19, nombre: 'Teatros' },
    { id: 20, nombre: 'Autos' },
    { id: 21, nombre: 'Cines' },
    { id: 22, nombre: 'Inmobiliarias' },
    { id: 23, nombre: 'Inmuebles' },
  ];

  @Get('categorias-bonda')
  async getCategoriasBonda(): Promise<
    { id: number; nombre: string; parent_id?: number | null }[]
  > {
    const todo = { id: 0, nombre: 'Todo' };
    try {
      const bondaCategorias = await this.bondaService.obtenerCategorias({
        slug: this.FUNDACION_PADRES_CONFIG.slug,
      });
      const normalizedBonda = new Map<string, number>();
      for (const c of bondaCategorias) {
        const key = this.normalizarNombre(c.nombre);
        if (!normalizedBonda.has(key)) normalizedBonda.set(key, c.id);
      }
      const result: { id: number; nombre: string }[] = [todo];
      for (const label of this.FILTROS_LABELS) {
        const keys = [
          this.normalizarNombre(label),
          ...(this.FILTROS_ALIASES[label] || []).map((a) =>
            this.normalizarNombre(a),
          ),
        ];
        let id: number | undefined;
        for (const key of keys) {
          id = normalizedBonda.get(key);
          if (id != null) break;
        }
        if (id != null) result.push({ id, nombre: label });
      }
      // Si Bonda no devolvió coincidencias, devolver siempre la lista completa para que el filtro sea usable
      if (result.length <= 1) return this.CATEGORIAS_FALLBACK;
      return result;
    } catch (error) {
      return this.CATEGORIAS_FALLBACK;
    }
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
          descripcion: cupon.descripcionBreve ?? null,
          empresa: cupon.empresa.nombre,
          imagen_url:
            cupon.imagenes.principal?.['280x190'] ||
            cupon.imagenes.thumbnail?.['90x90'] ||
            null,
          logo_empresa: cupon.empresa.logoThumbnail?.['90x90'] || null,
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
