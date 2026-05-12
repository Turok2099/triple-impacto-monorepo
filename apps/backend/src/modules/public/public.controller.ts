import {
  Controller,
  Get,
  Post,
  Query,
  UnauthorizedException,
  Req,
  Headers,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../supabase/supabase.service';
import { SyncService } from '../sync/sync.service';
import { ConfigService } from '@nestjs/config';
import { BondaService } from '../bonda/bonda.service';
import { MailService } from '../mail/mail.service';

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
  activa: boolean;
  verificada: boolean;
  created_at: string;
  updated_at: string;
}

@Controller('public')
export class PublicController {
  // Configuración del Bot Público (Opción 3)
  private readonly PUBLIC_BOT_CONFIG: {
    dni: string;
    masterSlug: string;
  };

  // Simple caché en memoria para el catálogo público
  private catalogCache: {
    data: any;
    timestamp: number;
  } | null = null;
  private readonly CACHE_TTL = 6 * 60 * 60 * 1000; // 6 horas en ms

  constructor(
    private readonly supabase: SupabaseService,
    private readonly syncService: SyncService,
    private readonly configService: ConfigService,
    private readonly bondaService: BondaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {
    // Inicializar configuración del Bot desde variables de entorno
    this.PUBLIC_BOT_CONFIG = {
      dni: this.configService.get<string>('bonda.publicBot.dni') || '10101010',
      masterSlug: this.configService.get<string>('bonda.publicBot.masterSlug') || 'https://clubplatolleno.bonda.com',
    };

    // Validar que el DNI del Bot esté configurado
    if (!this.PUBLIC_BOT_CONFIG.dni) {
      console.warn(
        '⚠️ ADVERTENCIA: DNI del Bot de Bonda no configurado en variables de entorno',
      );
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
  ): Promise<any> {
    try {
      const now = Date.now();
      let cuponesBase: any[] = [];

      // 1. Verificar si tenemos el catálogo en caché y es válido
      if (this.catalogCache && (now - this.catalogCache.timestamp < this.CACHE_TTL)) {
        cuponesBase = this.catalogCache.data;
      } else {
        // 2. Si no hay caché, solicitar a Bonda usando el Bot de Servicio
        const response = await this.bondaService.obtenerCupones(
          this.PUBLIC_BOT_CONFIG.dni,
          {
            slug: this.PUBLIC_BOT_CONFIG.masterSlug,
          },
        );

        if (response && response.cupones) {
          cuponesBase = response.cupones.map((c: any) => ({
            id: c.id.toString(),
            nombre: c.nombre,
            descuento: c.descuento,
            descripcion: c.descripcionBreve ?? null,
            empresa: {
              nombre: c.empresa?.nombre,
            },
            imagen_url: c.imagenes?.principal?.['280x190'] || c.imagenes?.principal?.original || null,
            logo_empresa: c.empresa?.logoThumbnail?.['90x90'] || null,
            categoria_principal: c.categorias?.[0]?.nombre || null,
            fecha_vencimiento: c.fechaVencimiento || null,
          }));

          // Actualizar caché
          this.catalogCache = {
            data: cuponesBase,
            timestamp: now,
          };
        }
      }

      // 3. Aplicar filtros locales sobre los datos obtenidos
      let cuponesFiltrados = [...cuponesBase];

      if (categoria && categoria !== 'Todo') {
        const catNormalizada = this.normalizarNombre(categoria);
        cuponesFiltrados = cuponesFiltrados.filter(c => 
          this.normalizarNombre(c.categoria_principal) === catNormalizada
        );
      }

      if (busqueda) {
        const busqNormalizada = this.normalizarNombre(busqueda);
        cuponesFiltrados = cuponesFiltrados.filter(c => 
          this.normalizarNombre(c.nombre).includes(busqNormalizada) || 
          this.normalizarNombre(c.empresa.nombre).includes(busqNormalizada)
        );
      }

      // 4. Deduplicación por MARCA (por defecto true para home)
      const shouldDeduplicate = deduplicate !== 'false';
      if (shouldDeduplicate) {
        const seen = new Set();
        cuponesFiltrados = cuponesFiltrados.filter(c => {
          if (seen.has(c.empresa.nombre)) return false;
          seen.add(c.empresa.nombre);
          return true;
        });
      }

      // 5. Paginación manual sobre el set de datos
      const limitVal = limite ? parseInt(limite, 10) : 20;
      const offsetVal = offset ? parseInt(offset, 10) : 0;
      const paginados = cuponesFiltrados.slice(offsetVal, offsetVal + limitVal);

      return {
        count: paginados.length,
        cupones: paginados,
        total_disponible: cuponesFiltrados.length,
        sincronizado_desde: 'bonda-proxy-cache',
        deduplicated: shouldDeduplicate,
        cached_at: new Date(this.catalogCache?.timestamp || now).toISOString(),
      };
    } catch (error) {
      console.error('Error in getCuponesDesdeBonda (Proxy):', error);
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
   * Obtiene los banners activos para el carrusel de la home.
   * GET /api/public/banners
   */
  @Get('banners')
  async getBanners(): Promise<any[]> {
    const { data, error } = await this.supabase.getClient()
      .from('banners')
      .select('id, title, image_url, link_url, order')
      .eq('is_active', true)
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching public banners:', error);
      return [];
    }
    return data || [];
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

    const resultado = await this.syncService.sincronizarTodosMicrositios();

    return {
      success: true,
      message: 'Sync de cupones ejecutado exitosamente',
      timestamp: new Date().toISOString(),
      data: resultado,
    };
  }

  /**
   * Endpoint público para el formulario de contacto.
   * Envía un email al administrador usando Resend.
   */
  @Post('contact')
  async contactForm(
    @Body() body: { nombre: string; email: string; telefono?: string; asunto: string; mensaje: string }
  ) {
    if (!body.nombre || !body.email || !body.asunto || !body.mensaje) {
      throw new BadRequestException('Faltan campos obligatorios');
    }

    const success = await this.mailService.sendContactEmail(
      body.nombre,
      body.email,
      body.telefono || '',
      body.asunto,
      body.mensaje
    );

    if (!success) {
      throw new BadRequestException('Ocurrió un error al enviar el mensaje');
    }

    return {
      success: true,
      message: 'Mensaje enviado exitosamente',
    };
  }
}
