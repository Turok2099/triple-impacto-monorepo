import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UnauthorizedException,
  Req,
  Headers,
  Body,
  BadRequestException,
  NotFoundException,
  Logger,
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
  slug: string | null;
  bonda_slug: string | null;
  activa: boolean;
  verificada: boolean;
  created_at: string;
  updated_at: string;
}

@Controller('public')
export class PublicController {
  private readonly logger = new Logger(PublicController.name);

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

  /** Normaliza nombre para comparar con respuestas de Bonda (minúsculas, sin acentos, trim). */
  private normalizarNombre(n: string): string {
    return (n || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\u0300-\u036f/g, '');
  }

  /**
   * Categorías para el filtro: dinámicas desde Bonda (Root categories).
   * GET /api/public/categorias-bonda
   */

  @Get('categorias-bonda')
  async getCategoriasBonda(): Promise<
    { id: number; nombre: string; parent_id?: number | null }[]
  > {
    const todo = { id: 0, nombre: 'Todo' };
    
    try {
      // 1. Intentar extraer categorías dinámicamente desde el catálogo en caché (lo más fiable)
      if (this.catalogCache && this.catalogCache.data.length > 0) {
        const uniqueCategories = Array.from(
          new Set(this.catalogCache.data.map(c => c.categoria_principal))
        )
        .filter(Boolean)
        .sort()
        .map((nombre, index) => ({
          id: index + 1000, // IDs temporales para el front
          nombre: nombre as string
        }));

        if (uniqueCategories.length > 0) {
          return [todo, ...uniqueCategories];
        }
      }

      // 2. Si no hay caché, intentar con la API de Bonda (Root categories)
      const bondaCategorias = await this.bondaService.obtenerCategorias({
        slug: this.PUBLIC_BOT_CONFIG.masterSlug,
      });

      const rootCategories = bondaCategorias
        .filter(c => !c.parent_id)
        .map(c => ({
          id: c.id,
          nombre: c.nombre
        }));

      if (rootCategories.length > 0) {
        return [todo, ...rootCategories];
      }

      // 3. Fallback final
      return [
        todo,
        { id: 13, nombre: 'Compras' },
        { id: 12, nombre: 'Gastronomía' },
        { id: 11, nombre: 'Turismo' },
        { id: 17, nombre: 'Entretenimientos' },
      ];
    } catch (error) {
      this.logger.error('Error al obtener categorías:', error.message);
      return [
        todo,
        { id: 13, nombre: 'Compras' },
        { id: 12, nombre: 'Gastronomía' },
      ];
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
      this.logger.log('🔄 Obteniendo cupones desde Supabase (public_coupons_v2)...');
      
      // Obtenemos TODOS los cupones que coincidan con los filtros básicos (categoría y búsqueda)
      // para poder hacer la deduplicación por marca en memoria (o paginamos si no se requiere deduplicar).
      // Sin embargo, si traemos todos, podemos aplicar la paginación final aquí de manera segura.
      const res = await this.supabase.getPublicCouponsV2({
        categoria,
        busqueda,
        soloActivos: true,
        // No pasamos límite ni offset aquí si necesitamos deduplicar primero
      });

      let cuponesFiltrados = res.cupones.map((c: any) => ({
        id: c.bonda_cupon_id || c.id,
        nombre: c.nombre,
        descuento: c.descuento,
        descripcion: c.descripcion ?? null,
        empresa: {
          nombre: c.empresa_nombre,
        },
        imagen_url: c.imagen_url || null,
        logo_empresa: c.empresa_logo_url || null,
        categoria_principal: c.categoria_principal || null,
        fecha_vencimiento: c.fecha_vencimiento || null,
      }));

      // Deduplicación por MARCA (por defecto true para home)
      const shouldDeduplicate = deduplicate !== 'false';
      if (shouldDeduplicate) {
        const seen = new Set();
        cuponesFiltrados = cuponesFiltrados.filter(c => {
          if (!c.empresa.nombre) return true; // Si no tiene empresa, lo dejamos
          if (seen.has(c.empresa.nombre)) return false;
          seen.add(c.empresa.nombre);
          return true;
        });
      }

      // Paginación manual
      const limitVal = limite ? parseInt(limite, 10) : 20;
      const offsetVal = offset ? parseInt(offset, 10) : 0;
      const paginados = cuponesFiltrados.slice(offsetVal, offsetVal + limitVal);

      return {
        count: paginados.length,
        cupones: paginados,
        total_disponible: cuponesFiltrados.length,
        sincronizado_desde: 'supabase',
        deduplicated: shouldDeduplicate,
        cached_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error in getCuponesDesdeBonda (Supabase):', error);
      throw error;
    }
  }

  /**
   * Organizaciones activas con monto_minimo y monto_sugerido.
   * Para que el front obtenga montos por ONG (donaciones).
   */
  @Get('organizaciones')
  async getOrganizaciones(@Query('forPayment') forPayment?: string): Promise<OrganizacionPublicDto[]> {
    const requireFiserv = forPayment === 'true';
    return this.supabase.getOrganizacionesActivas(requireFiserv);
  }

  /**
   * Obtiene los detalles de una organización activa dado su slug.
   * GET /api/public/organizaciones/slug/:slug
   */
  @Get('organizaciones/slug/:slug')
  async getOrganizacionBySlug(@Param('slug') slug: string) {
    const org = await this.supabase.getOrganizacionBySlug(slug);
    if (!org) {
      throw new NotFoundException(`Organización con slug "${slug}" no encontrada`);
    }
    return org;
  }

  /**
   * Obtiene los banners activos para el carrusel de la home.
   * GET /api/public/banners
   */
  @Get('banners')
  async getBanners(): Promise<any[]> {
    const { data, error } = await this.supabase.getClient()
      .from('banners')
      .select('id, title, image_url, device_type, link_url, order')
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
