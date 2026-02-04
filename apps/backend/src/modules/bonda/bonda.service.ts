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

/** Config usada para llamar a la API de Bonda (token + microsite_id). */
export interface BondaMicrositeConfig {
  api_token: string;
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
        microsite_id: row.microsite_id ?? '',
      };
    }
    if (this.apiKey && this.micrositeId) {
      return {
        api_token: this.apiKey,
        microsite_id: this.micrositeId,
      };
    }
    return null;
  }

  async obtenerCupones(
    codigoAfiliado: string,
    options?: BondaMicrositeOptions,
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
      const params = {
        key: config.api_token,
        micrositio_id: config.microsite_id,
        codigo_afiliado: codigoAfiliado,
      };

      const response = await firstValueFrom(
        this.httpService.get(url, { params }),
      );

      return this.transformBondaResponse(response.data);
    } catch (error) {
      this.logger.error('Error al obtener cupones de Bonda:', error.message);
      throw new Error('Error al obtener cupones de Bonda');
    }
  }

  private transformBondaResponse(data: any): CuponesResponseDto {
    const cupones: CuponDto[] = (data.results || []).map((item: any) => ({
      id: item.id?.toString() || '',
      nombre: item.nombre || '',
      descuento: item.descuento || '',
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
    }));

    return {
      count: data.count || cupones.length,
      cupones,
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
            token: config.api_token,
            'Content-Type': 'application/json',
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error al crear afiliado en Bonda:', error.message);

      if (error.response?.data) {
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
            token: config.api_token,
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
            token: config.api_token,
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

    // 2. Obtener TODOS los cupones recibidos del usuario desde Bonda
    const cuponesResponse = await this.obtenerCupones(codigoAfiliado, {
      slug: micrositioSlug,
    });

    // 3. Buscar el cupón específico por ID
    const cuponEncontrado = cuponesResponse.cupones.find(
      (c) => c.id === bondaCuponId,
    );

    if (!cuponEncontrado) {
      throw new Error(
        'Cupón no encontrado en tu lista de cupones recibidos de Bonda. ' +
          'Asegúrate de que ya lo hayas solicitado en el sistema de Bonda.',
      );
    }

    // 4. Obtener el microsite_id desde la BD
    const microsite =
      await this.supabase.getBondaMicrositeBySlug(micrositioSlug);

    if (!microsite) {
      throw new Error(`Micrositio no encontrado: ${micrositioSlug}`);
    }

    // 5. Guardar el cupón en nuestra BD
    const cuponGuardado = await this.supabase.guardarCuponSolicitado({
      usuario_id: usuarioId,
      bonda_cupon_id: cuponEncontrado.id,
      nombre: cuponEncontrado.nombre,
      descuento: cuponEncontrado.descuento,
      empresa_nombre: cuponEncontrado.empresa?.nombre || '',
      empresa_id: cuponEncontrado.empresa?.id || '',
      codigo: cuponEncontrado.envio?.codigo || undefined,
      codigo_id: cuponEncontrado.envio?.codigoId || undefined,
      codigo_afiliado: codigoAfiliado,
      micrositio_slug: micrositioSlug,
      bonda_microsite_id: microsite.id,
      mensaje: cuponEncontrado.envio?.mensaje || undefined,
      operadora: cuponEncontrado.envio?.operadora || undefined,
      celular: celular || cuponEncontrado.envio?.celular || undefined,
      imagen_thumbnail:
        cuponEncontrado.imagenes?.thumbnail?.['90x90'] || undefined,
      imagen_principal:
        cuponEncontrado.imagenes?.principal?.['280x190'] || undefined,
      imagen_apaisada:
        cuponEncontrado.imagenes?.apaisada?.['240x80'] || undefined,
      bonda_raw_data: cuponEncontrado,
    });

    this.logger.log(
      `✅ Cupón solicitado: ${cuponEncontrado.nombre} (código: ${cuponEncontrado.envio?.codigo || 'N/A'})`,
    );

    return cuponGuardado;
  }
}
