import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SupabaseService } from '../supabase/supabase.service';
import { CuponesResponseDto } from './dto/cupones-response.dto';
import { CuponDto } from './dto/cupon.dto';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
import { UpdateAffiliateDto } from './dto/update-affiliate.dto';
import {
  BondaAffiliateResponse,
  BondaDeleteResponse,
} from './dto/affiliate-response.dto';

export interface BondaMicrositeConfig {
  api_token: string;
  api_token_nominas: string | null;
  microsite_id: string;
}

/** Opciones para resolver el micrositio: por slug o por organizacion_id. */
export interface BondaMicrositeOptions {
  slug?: string;
  organizacionId?: string;
}

@Injectable()
export class BondaService {
  private readonly logger = new Logger(BondaService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly micrositeId: string;
  private readonly useMocks: boolean;

  constructor(
    private readonly httpService: HttpService,
    private readonly supabase: SupabaseService,
  ) {
    this.apiUrl = process.env.BONDA_API_URL || 'https://apiv1.cuponstar.com';
    this.apiKey = process.env.BONDA_API_KEY || '';
    this.micrositeId = process.env.BONDA_MICROSITE_ID || '';
    this.useMocks =
      !this.apiKey ||
      !this.micrositeId ||
      process.env.BONDA_USE_MOCKS === 'true';

    if (this.useMocks) {
      this.logger.warn(
        '⚠️ BondaService: MOCKS habilitados cuando no se pasa config desde DB',
      );
    }
  }

  /**
   * Resuelve config de Bonda desde bonda_microsites (por slug u organizacion_id)
   * o desde env si no se pasa ninguna opción (retrocompat).
   */
  private async resolveConfig(
    options?: BondaMicrositeOptions,
  ): Promise<BondaMicrositeConfig | null> {
    if (options?.slug) {
      const row = await this.supabase.getBondaMicrositeBySlug(options.slug);
      if (!row) {
        throw new Error(`Micrositio no encontrado: slug="${options.slug}"`);
      }
      return {
        api_token: row.api_token,
        api_token_nominas: row.api_token_nominas,
        microsite_id: row.microsite_id ?? '',
      };
    }
    if (options?.organizacionId) {
      const row = await this.supabase.getBondaMicrositeByOrganizacionId(
        options.organizacionId,
      );
      if (!row) {
        throw new Error(
          `Micrositio no encontrado: organizacion_id="${options.organizacionId}"`,
        );
      }
      return {
        api_token: row.api_token,
        api_token_nominas: row.api_token_nominas,
        microsite_id: row.microsite_id ?? '',
      };
    }
    if (this.apiKey && this.micrositeId) {
      return {
        api_token: this.apiKey,
        api_token_nominas: process.env.BONDA_API_KEY_NOMINAS || this.apiKey,
        microsite_id: this.micrositeId,
      };
    }
    return null;
  }

  async obtenerCupones(
    codigoAfiliado: string,
    options?: BondaMicrositeOptions & {
      categoria?: number;
      orderBy?: 'latest' | 'relevant' | 'ownRelevant';
      subcategories?: boolean;
      page?: number;
    },
  ): Promise<CuponesResponseDto> {
    const config = await this.resolveConfig(options);
    if (!config && this.useMocks) {
      return this.getCuponesMock(codigoAfiliado);
    }
    if (!config) {
      throw new Error(
        'Se requiere microsite (slug) u organizacion_id, o configurar BONDA_API_KEY y BONDA_MICROSITE_ID en env',
      );
    }

    try {
      // Endpoint corregido: /api/cupones retorna catálogo DISPONIBLE (no usados)
      // Retorna 1600+ cupones del micrositio vs 25 cupones usados de /api/cupones_recibidos
      const url = `${this.apiUrl}/api/cupones`;
      const params: any = {
        key: config.api_token,
        micrositio_id: config.microsite_id,
        codigo_afiliado: codigoAfiliado,
        subcategories: options?.subcategories ?? true, // Retornar subcategorías por defecto
      };

      // Agregar filtros opcionales
      if (options?.categoria) {
        params.categoria = options.categoria;
      }
      if (options?.orderBy) {
        params.orderBy = options.orderBy;
      }
      if (options?.page) {
        params.page = options.page;
      }

      const response = await firstValueFrom(
        this.httpService.get(url, { params }),
      );

      return this.transformBondaResponse(response.data);
    } catch (error) {
      this.logger.error('Error al obtener cupones de Bonda:', error.message);
      throw new Error('Error al obtener cupones de Bonda');
    }
  }

  /**
   * Obtiene las categorías disponibles del micrositio de Bonda.
   */
  async obtenerCategorias(
    options?: BondaMicrositeOptions,
  ): Promise<{ id: number; nombre: string; parent_id?: number | null }[]> {
    const config = await this.resolveConfig(options);
    if (!config) {
      throw new Error(
        'Se requiere microsite (slug) u organizacion_id para obtener categorías',
      );
    }

    try {
      const url = `${this.apiUrl}/api/categorias`;
      const params = {
        key: config.api_token,
        micrositio_id: config.microsite_id,
      };

      const response = await firstValueFrom(
        this.httpService.get(url, { params }),
      );

      return response.data.results || [];
    } catch (error) {
      this.logger.error('Error al obtener categorías de Bonda:', error.message);
      throw new Error('Error al obtener categorías de Bonda');
    }
  }

  /**
   * Obtiene los cupones recibidos/solicitados por un afiliado (últimos 25).
   * Llama al endpoint /api/cupones_recibidos de Bonda.
   */
  async obtenerCuponesRecibidos(
    codigoAfiliado: string,
    options?: BondaMicrositeOptions,
  ): Promise<CuponesResponseDto> {
    const config = await this.resolveConfig(options);
    if (!config || this.useMocks) {
      this.logger.warn('obtenerCuponesRecibidos: usando respuesta vacía');
      return { count: 0, cupones: [], next: null, previous: null };
    }

    const params = new URLSearchParams({
      key: config.api_token,
      micrositio_id: config.microsite_id,
      codigo_afiliado: codigoAfiliado,
    });

    const url = `${this.apiUrl}/api/cupones_recibidos?${params.toString()}`;
    this.logger.log(
      `Llamando a Bonda cupones_recibidos (afiliado=${codigoAfiliado})`,
    );

    const response = await firstValueFrom(
      this.httpService.get(url, { timeout: 10000 }),
    );

    // La respuesta de cupones_recibidos usa "results" en lugar de "cupones"
    return this.transformBondaResponse(response.data);
  }

  private transformBondaResponse(data: any): CuponesResponseDto {
    const cupones: CuponDto[] = (data.results || []).map((item: any) => ({
      id: item.id?.toString() || '',
      nombre: item.nombre || '',
      descuento: item.descuento || '',
      descripcionBreve: item.descripcion_breve || undefined,
      codigoAfiliado: item.codigo_afiliado?.toString() || '',
      micrositioId: item.micrositio_id?.toString() || '',
      incluirCodigo: item.incluir_codigo?.toString() || '',
      empresa: {
        id: item.empresa?.id?.toString() || '',
        nombre: item.empresa?.nombre || '',
        logoThumbnail: item.empresa?.logo_thumbnail,
      },
      imagenes: {
        thumbnail: item.foto_thumbnail,
        principal: item.foto_principal,
        apaisada: item.foto_apaisada,
      },
      envio: item.envio
        ? {
            codigoId: item.envio.codigo_id || '',
            smsId: item.envio.sms_id,
            codigo: item.envio.codigo,
            operadora: item.envio.operadora,
            celular: item.envio.celular,
            mensaje: item.envio.mensaje,
            fecha: item.envio.fecha,
          }
        : undefined,
      categorias: item.categorias || undefined,
    }));

    // NO deduplicar aquí - retornar todos los cupones tal como vienen de Bonda
    // La deduplicación por marca se hace solo en los endpoints públicos del frontend

    return {
      count: data.count || cupones.length,
      cupones: cupones,
      next: data.next || null,
      previous: data.previous || null,
    };
  }

  private getCuponesMock(codigoAfiliado: string): CuponesResponseDto {
    // Mock basado en la estructura de respuesta de Bonda
    // Simula cupones del catálogo general (sin usar/comprados)
    // NO incluyen información de envío porque aún no han sido adquiridos por el usuario
    const mockCupones: CuponDto[] = [
      {
        id: '2048',
        nombre: 'Cinemark Palermo',
        descuento: '2x1',
        codigoAfiliado,
        micrositioId: '202',
        incluirCodigo: '1',
        empresa: {
          id: '13',
          nombre: 'Cinemark Palermo',
          logoThumbnail: {
            '90x90': 'https://via.placeholder.com/90x90?text=Cinemark',
          },
        },
        imagenes: {
          thumbnail: {
            '90x90': 'https://via.placeholder.com/90x90?text=Cinemark',
          },
          principal: {
            '280x190': 'https://via.placeholder.com/280x190?text=Cinemark',
          },
          apaisada: {
            '240x80': 'https://via.placeholder.com/240x80?text=Cinemark',
          },
        },
        // Sin envio - cupón disponible pero no adquirido
      },
      {
        id: '1263',
        nombre: "Wendy's",
        descuento: '2x1',
        codigoAfiliado,
        micrositioId: '202',
        incluirCodigo: '1',
        empresa: {
          id: '1176',
          nombre: "Wendy's",
          logoThumbnail: {
            '90x90': 'https://via.placeholder.com/90x90?text=Wendys',
          },
        },
        imagenes: {
          thumbnail: {
            '90x90': 'https://via.placeholder.com/90x90?text=Wendys',
          },
          principal: {
            '280x190': 'https://via.placeholder.com/280x190?text=Wendys',
          },
          apaisada: {
            '240x80': 'https://via.placeholder.com/240x80?text=Wendys',
          },
        },
        // Sin envio - cupón disponible pero no adquirido
      },
      {
        id: '3557',
        nombre: 'Viandas Cormillot',
        descuento: '10%',
        codigoAfiliado,
        micrositioId: '202',
        incluirCodigo: '0',
        empresa: {
          id: '2363',
          nombre: 'Viandas Cormillot',
          logoThumbnail: {
            '90x90': 'https://via.placeholder.com/90x90?text=Cormillot',
          },
        },
        imagenes: {
          principal: {
            '280x190': 'https://via.placeholder.com/280x190?text=Cormillot',
          },
          apaisada: {
            '240x80': 'https://via.placeholder.com/240x80?text=Cormillot',
          },
        },
        // Sin envio - cupón disponible pero no adquirido
      },
    ];

    return {
      count: mockCupones.length,
      cupones: mockCupones,
    };
  }

  // ========================================
  // GESTIÓN DE AFILIADOS EN BONDA
  // ========================================

  /**
   * Crear un nuevo afiliado en Bonda
   * POST /api/v2/microsite/{microsite_id}/affiliates
   *
   * Si el usuario fue eliminado hace menos de 30 días, será restaurado.
   */
  async crearAfiliado(
    affiliateData: CreateAffiliateDto,
    options?: BondaMicrositeOptions,
  ): Promise<BondaAffiliateResponse> {
    const config = await this.resolveConfig(options);
    if (!config && this.useMocks) {
      return this.crearAfiliadoMock(affiliateData);
    }
    if (!config) {
      throw new Error(
        'Se requiere microsite (slug) u organizacion_id, o configurar BONDA_API_KEY y BONDA_MICROSITE_ID en env',
      );
    }

    try {
      const url = `${this.apiUrl}/api/v2/microsite/${config.microsite_id}/affiliates`;

      const response = await firstValueFrom(
        this.httpService.post(url, affiliateData, {
          headers: {
            token: config.api_token_nominas || config.api_token,
            'Content-Type': 'application/json',
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error al crear afiliado en Bonda: ${error.message}`);

      if (error.response?.data) {
        this.logger.error(
          'Respuesta de Bonda (detalles del error):',
          error.response.data,
        );
        return error.response.data;
      }

      throw new Error('Error al crear afiliado en Bonda');
    }
  }

  /**
   * Actualizar un afiliado existente en Bonda
   * PATCH /api/v2/microsite/{microsite_id}/affiliates/{affiliate_code}
   *
   * SOLO se envían los campos que se desean actualizar.
   */
  async actualizarAfiliado(
    affiliateCode: string,
    updateData: UpdateAffiliateDto,
    options?: BondaMicrositeOptions,
  ): Promise<BondaAffiliateResponse> {
    const config = await this.resolveConfig(options);
    if (!config && this.useMocks) {
      return this.actualizarAfiliadoMock(affiliateCode, updateData);
    }
    if (!config) {
      throw new Error(
        'Se requiere microsite (slug) u organizacion_id, o configurar BONDA_API_KEY y BONDA_MICROSITE_ID en env',
      );
    }

    try {
      const url = `${this.apiUrl}/api/v2/microsite/${config.microsite_id}/affiliates/${affiliateCode}`;

      const response = await firstValueFrom(
        this.httpService.patch(url, updateData, {
          headers: {
            token: config.api_token_nominas || config.api_token,
            'Content-Type': 'application/json',
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Error al actualizar afiliado en Bonda:',
        error.message,
      );

      if (error.response?.data) {
        return error.response.data;
      }

      throw new Error('Error al actualizar afiliado en Bonda');
    }
  }

  /**
   * Eliminar un afiliado de Bonda
   * DELETE /api/v2/microsite/{microsite_id}/affiliates/{affiliate_code}
   *
   * Soft delete por 30 días. Después de ese período, la eliminación es permanente.
   */
  async eliminarAfiliado(
    affiliateCode: string,
    options?: BondaMicrositeOptions,
  ): Promise<BondaDeleteResponse> {
    const config = await this.resolveConfig(options);
    if (!config && this.useMocks) {
      return this.eliminarAfiliadoMock(affiliateCode);
    }
    if (!config) {
      throw new Error(
        'Se requiere microsite (slug) u organizacion_id, o configurar BONDA_API_KEY y BONDA_MICROSITE_ID en env',
      );
    }

    try {
      const url = `${this.apiUrl}/api/v2/microsite/${config.microsite_id}/affiliates/${affiliateCode}`;

      const response = await firstValueFrom(
        this.httpService.delete(url, {
          headers: {
            token: config.api_token_nominas || config.api_token,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error al eliminar afiliado en Bonda:', error.message);

      if (error.response?.data) {
        return error.response.data;
      }

      throw new Error('Error al eliminar afiliado en Bonda');
    }
  }

  /**
   * Obtener un afiliado por código desde Bonda API
   * GET /api/v2/microsite/{microsite_id}/affiliates/{affiliate_code}
   *
   * Retorna el usuario completo con member, segmentation y company.
   * Si el usuario se encuentra soft-deleteado, NO será visible (retorna null).
   */
  async obtenerAfiliado(
    affiliateCode: string,
    options?: BondaMicrositeOptions,
  ): Promise<any> {
    const config = await this.resolveConfig(options);
    if (!config && this.useMocks) {
      return this.obtenerAfiliadoMock(affiliateCode);
    }
    if (!config) {
      throw new Error(
        'Se requiere microsite (slug) u organizacion_id, o configurar BONDA_API_KEY y BONDA_MICROSITE_ID en env',
      );
    }

    try {
      const url = `${this.apiUrl}/api/v2/microsite/${config.microsite_id}/affiliates/${affiliateCode}`;

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            token: config.api_token_nominas || config.api_token,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Error al obtener afiliado desde Bonda:',
        error.message,
      );

      // Si el usuario no existe (404), retornar null en lugar de lanzar error
      if (error.response?.status === 404) {
        return null;
      }

      if (error.response?.data) {
        return error.response.data;
      }

      throw new Error('Error al obtener afiliado desde Bonda');
    }
  }

  // ========================================
  // MOCKS PARA AFILIADOS
  // ========================================

  private crearAfiliadoMock(
    affiliateData: CreateAffiliateDto,
  ): BondaAffiliateResponse {
    this.logger.log(
      `[MOCK] Creando afiliado: ${JSON.stringify(affiliateData)}`,
    );

    return {
      success: true,
      data: {
        id: Math.floor(Math.random() * 10000),
        code: affiliateData.code,
        email: affiliateData.email,
        nombre: affiliateData.nombre,
        telefono: affiliateData.telefono,
        provincia: affiliateData.provincia,
        localidad: affiliateData.localidad,
        created_at: new Date().toISOString(),
      },
    };
  }

  private actualizarAfiliadoMock(
    affiliateCode: string,
    updateData: UpdateAffiliateDto,
  ): BondaAffiliateResponse {
    this.logger.log(
      `[MOCK] Actualizando afiliado ${affiliateCode}: ${JSON.stringify(updateData)}`,
    );

    return {
      success: true,
      data: {
        code: affiliateCode,
        ...updateData,
        updated_at: new Date().toISOString(),
      },
    };
  }

  private eliminarAfiliadoMock(affiliateCode: string): BondaDeleteResponse {
    this.logger.log(`[MOCK] Eliminando afiliado: ${affiliateCode}`);

    return {
      success: true,
      data: {
        deleted: 1,
      },
    };
  }

  private obtenerAfiliadoMock(affiliateCode: string): any {
    this.logger.log(`[MOCK] Obteniendo afiliado: ${affiliateCode}`);

    return {
      success: true,
      data: {
        member: {
          id: '12345',
          code: affiliateCode,
          company_id: '909092',
          email: 'mock@example.com',
          nombre: 'Usuario Mock',
        },
        segmentation: {
          id: 331,
          name: 'Segmentación general',
          default: true,
        },
        company: {
          id: '909092',
          name: 'Micrositio Mock',
          accesstype: 'Código',
          open_site: true,
        },
      },
    };
  }

  // ========================================
  // SOLICITAR CUPÓN ESPECÍFICO (Dashboard)
  // ========================================

  /**
   * Solicitar un cupón específico de Bonda para el usuario
   *
   * NOTA IMPORTANTE sobre cómo funciona Bonda:
   * El endpoint /api/cupones_recibidos devuelve los cupones que el usuario ya "recibió".
   * No hay un endpoint separado para "solicitar" un cupón individual.
   *
   * Por lo tanto, este método:
   * 1. Obtiene TODOS los cupones recibidos del usuario
   * 2. Busca el cupón específico por ID
   * 3. Lo guarda en nuestra BD con el código visible
   * 4. Retorna el cupón con su código
   *
   * Si el cupón no está en la lista de "recibidos", significa que el usuario
   * aún no lo ha solicitado en el sitio de Bonda. En ese caso, deberías
   * implementar lógica adicional según tu flujo de negocio.
   */
  /**
   * Solicita un cupón a Bonda usando POST /api/cupones/{id}/codigo
   * Este endpoint devuelve el código directamente sin enviar SMS
   */
  async solicitarCodigoCupon(
    bondaCuponId: string,
    codigoAfiliado: string,
    options?: BondaMicrositeOptions,
  ): Promise<{
    codigo: string;
    instrucciones: string;
    textoSms: string;
    codigoId: string;
  }> {
    const config = await this.resolveConfig(options);
    if (!config || this.useMocks) {
      this.logger.warn('solicitarCodigoCupon: usando mock');
      return {
        codigo: 'MOCK-' + bondaCuponId,
        instrucciones: '<p>Instrucciones mock</p>',
        textoSms: 'Texto SMS mock',
        codigoId: 'mock-id-' + Date.now(),
      };
    }

    // Crear form-data según especificación de Bonda
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('key', config.api_token);
    formData.append('micrositio_id', config.microsite_id);
    formData.append('codigo_afiliado', codigoAfiliado);
    formData.append('split', '1');

    const url = `${this.apiUrl}/api/cupones/${bondaCuponId}/codigo`;
    this.logger.log(
      `Solicitando código de cupón ${bondaCuponId} para afiliado ${codigoAfiliado}`,
    );

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, formData, {
          headers: formData.getHeaders(),
          timeout: 15000,
        }),
      );

      if (response.data?.success) {
        return {
          codigo: response.data.success.codigo || '',
          instrucciones: response.data.success.instrucciones || '',
          textoSms: response.data.success.texto_sms || '',
          codigoId: response.data.success.id?.toString() || '',
        };
      }

      throw new Error(
        'Respuesta inválida de Bonda al solicitar código de cupón',
      );
    } catch (error: any) {
      this.logger.error(
        `Error al solicitar código de cupón: ${error.message}`,
        error.response?.data,
      );
      throw new Error(
        `No se pudo obtener el código del cupón: ${error.message}`,
      );
    }
  }

  async solicitarCuponEspecifico(
    usuarioId: string,
    bondaCuponId: string,
    codigoAfiliado: string,
    micrositioSlug: string,
    celular?: string,
  ) {
    // 1. Verificar si el usuario puede solicitar este cupón (sin duplicados activos)
    const puedeSolicitar = await this.supabase.puedeSolicitarCupon(
      usuarioId,
      bondaCuponId,
    );

    if (!puedeSolicitar) {
      throw new Error('Ya tienes este cupón activo en tu dashboard');
    }

    // 2. Solicitar el código del cupón directamente a Bonda (NUEVO MÉTODO)
    const codigoResponse = await this.solicitarCodigoCupon(
      bondaCuponId,
      codigoAfiliado,
      { slug: micrositioSlug },
    );

    // 3. Obtener información del cupón desde el catálogo
    const cuponesResponse = await this.obtenerCupones(codigoAfiliado, {
      slug: micrositioSlug,
    });

    const cuponInfo = cuponesResponse.cupones.find(
      (c) => c.id === bondaCuponId,
    );

    if (!cuponInfo) {
      this.logger.warn(
        `Cupón ${bondaCuponId} no encontrado en catálogo, usando datos mínimos`,
      );
    }

    // 4. Obtener el microsite_id desde la BD
    const microsite =
      await this.supabase.getBondaMicrositeBySlug(micrositioSlug);

    if (!microsite) {
      throw new Error(`Micrositio no encontrado: ${micrositioSlug}`);
    }

    // 5. Guardar el cupón en nuestra BD con el código obtenido
    const cuponGuardado = await this.supabase.guardarCuponSolicitado({
      usuario_id: usuarioId,
      bonda_cupon_id: bondaCuponId,
      nombre: cuponInfo?.nombre || `Cupón ${bondaCuponId}`,
      descuento: cuponInfo?.descuento || '',
      empresa_nombre: cuponInfo?.empresa?.nombre || '',
      empresa_id: cuponInfo?.empresa?.id || '',
      codigo: codigoResponse.codigo, // Código obtenido del endpoint POST
      codigo_id: codigoResponse.codigoId,
      codigo_afiliado: codigoAfiliado,
      micrositio_slug: micrositioSlug,
      bonda_microsite_id: microsite.id,
      mensaje: codigoResponse.textoSms,
      operadora: undefined, // El endpoint POST no envía SMS
      celular: celular,
      imagen_thumbnail: cuponInfo?.imagenes?.thumbnail?.['90x90'] || undefined,
      imagen_principal:
        cuponInfo?.imagenes?.principal?.['280x190'] || undefined,
      imagen_apaisada: cuponInfo?.imagenes?.apaisada?.['240x80'] || undefined,
      bonda_raw_data: cuponInfo || { bondaCuponId, codigoResponse },
    });

    this.logger.log(
      `✅ Cupón solicitado: ${cuponInfo?.nombre || bondaCuponId} (código: ${codigoResponse.codigo})`,
    );

    return cuponGuardado;
  }
}
