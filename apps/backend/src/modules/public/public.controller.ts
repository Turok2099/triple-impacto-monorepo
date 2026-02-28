import {
  Controller,
  Get,
  Post,
  Query,
  UnauthorizedException,
  Req,
  Headers,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
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
  // Configuración de Fundación Padres desde variables de entorno (seguro)
  private readonly FUNDACION_PADRES_CONFIG: {
    slug: string;
    micrositeId: string;
    apiToken: string;
    codigoAfiliado: string;
  };

  constructor(
    private readonly supabase: SupabaseService,
    private readonly syncCuponesService: SyncCuponesService,
    private readonly configService: ConfigService,
    private readonly bondaService: BondaService,
    private readonly jwtService: JwtService,
  ) {
    // Inicializar configuración de Fundación Padres desde variables de entorno
    this.FUNDACION_PADRES_CONFIG = {
      slug: this.configService.get<string>('BONDA_MICROSITE_SLUG') || 'beneficios-fundacion-padres',
      micrositeId: this.configService.get<string>('BONDA_MICROSITE_ID') || '',
      apiToken: this.configService.get<string>('BONDA_API_KEY') || '',
      codigoAfiliado: this.configService.get<string>('BONDA_CODIGO_AFILIADO') || '',
    };

    // Validar que las credenciales de Bonda estén configuradas
    if (!this.FUNDACION_PADRES_CONFIG.apiToken || !this.FUNDACION_PADRES_CONFIG.micrositeId) {
      console.warn('⚠️ ADVERTENCIA: Credenciales de Bonda no configuradas en variables de entorno');
    }
  }

  /**
   * [DEPRECADO] Endpoint legacy que retornaba de tabla local.
   * Usar /public/cupones-bonda en su lugar para datos en tiempo real de Bonda.
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
   * Obtiene cupones desde Supabase (public_coupons_v2) con filtros.
   * GET /api/public/cupones-bonda
   *
   * Query params:
   * - categoria: Nombre de categoría (opcional, ej: "Gastronomía")
   * - busqueda: Término de búsqueda (opcional)
   * - limite: Número de cupones a retornar (opcional, default: todos)
   * - offset: Offset para paginación (opcional, default: 0)
   * - deduplicate: Si es 'false', muestra TODOS los cupones. Por defecto muestra solo 1 por marca.
   *
   * Este endpoint lee desde la tabla public_coupons_v2 de Supabase,
   * que se sincroniza automáticamente desde Bonda a las 3 AM Argentina.
   * Por defecto muestra solo 1 cupón por marca/empresa (útil para home).
   * Para dashboard, usar deduplicate=false para ver todos los cupones.
   */
  @Get('cupones-bonda')
  async getCuponesDesdeBonda(
    @Query('categoria') categoria?: string,
    @Query('busqueda') busqueda?: string,
    @Query('limite') limite?: string,
    @Query('offset') offset?: string,
    @Query('deduplicate') deduplicate?: string,
    @Headers('authorization') authorization?: string,
  ): Promise<any> {
    try {
      // Intentar extraer userId del token (opcional)
      let micrositeIds: string[] | undefined = undefined;

      if (authorization?.startsWith('Bearer ')) {
        try {
          const token = authorization.substring(7);
          const payload = this.jwtService.verify(token);
          const userId = payload.userId;

          if (userId) {
            // Obtener micrositios del usuario basado en sus donaciones
            micrositeIds = await this.supabase.getMicrositiosUsuario(userId);
          }
        } catch (error) {
          // Token inválido o expirado, continuar sin filtrar por micrositios
          console.warn('Token JWT inválido o expirado, mostrando todos los cupones');
        }
      }

      // Obtener cupones desde Supabase (sin filtro de ONG, catálogo global)
      const resultado = await this.supabase.getPublicCouponsV2({
        categoria: categoria && categoria !== 'Todo' ? categoria : undefined,
        busqueda,
        limite: limite ? parseInt(limite, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
        soloActivos: true,
      });

      // Transformar a formato compatible con el frontend actual
      const cuponesTransformados = resultado.cupones.map((cupon: any) => ({
        id: cupon.bonda_cupon_id,
        nombre: cupon.nombre,
        descuento: cupon.descuento,
        descripcion: cupon.descripcion_breve ?? null,
        empresa: {
          nombre: cupon.empresa_nombre,
        },
        imagen_url: cupon.imagen_principal_url || cupon.imagen_thumbnail_url || null,
        logo_empresa: cupon.empresa_logo_url || null,
        categoria_principal: cupon.categoria_principal || null,
        fecha_vencimiento: cupon.fecha_vencimiento || null,
      }));

      // Deduplicación opcional por MARCA (por defecto true para home)
      const shouldDeduplicate = deduplicate !== 'false'; // Por defecto true
      const cuponesFinal = shouldDeduplicate
        ? Array.from(
          new Map(cuponesTransformados.map((c) => [c.empresa.nombre, c])).values(),
        )
        : cuponesTransformados;

      return {
        count: cuponesFinal.length,
        cupones: cuponesFinal,
        total_disponible: resultado.total,
        sincronizado_desde: 'supabase',
        deduplicated: shouldDeduplicate,
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
