import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CuponesResponseDto } from './dto/cupones-response.dto';
import { CuponDto } from './dto/cupon.dto';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
import { UpdateAffiliateDto } from './dto/update-affiliate.dto';
import {
  BondaAffiliateResponse,
  BondaDeleteResponse,
} from './dto/affiliate-response.dto';

@Injectable()
export class BondaService {
  private readonly logger = new Logger(BondaService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly micrositeId: string;
  private readonly useMocks: boolean;

  constructor(private readonly httpService: HttpService) {
    // Configuración desde variables de entorno
    this.apiUrl = process.env.BONDA_API_URL || 'https://apiv1.cuponstar.com';
    this.apiKey = process.env.BONDA_API_KEY || '';
    this.micrositeId = process.env.BONDA_MICROSITE_ID || '';
    
    // Usar mocks si no hay credenciales configuradas
    this.useMocks = !this.apiKey || !this.micrositeId || process.env.BONDA_USE_MOCKS === 'true';

    if (this.useMocks) {
      this.logger.warn('⚠️ BondaService está usando MOCKS - No hay credenciales configuradas');
    }
  }

  async obtenerCupones(codigoAfiliado: string): Promise<CuponesResponseDto> {
    if (this.useMocks) {
      return this.getCuponesMock(codigoAfiliado);
    }

    try {
      const url = `${this.apiUrl}/api/cupones_recibidos`;
      const params = {
        key: this.apiKey,
        micrositio_id: this.micrositeId,
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
  ): Promise<BondaAffiliateResponse> {
    if (this.useMocks) {
      return this.crearAfiliadoMock(affiliateData);
    }

    try {
      const url = `${this.apiUrl}/api/v2/microsite/${this.micrositeId}/affiliates`;

      const response = await firstValueFrom(
        this.httpService.post(url, affiliateData, {
          headers: {
            token: this.apiKey,
            'Content-Type': 'application/json',
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error al crear afiliado en Bonda:', error.message);

      // Si es un error HTTP, retornar el error de Bonda
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
  ): Promise<BondaAffiliateResponse> {
    if (this.useMocks) {
      return this.actualizarAfiliadoMock(affiliateCode, updateData);
    }

    try {
      const url = `${this.apiUrl}/api/v2/microsite/${this.micrositeId}/affiliates/${affiliateCode}`;

      const response = await firstValueFrom(
        this.httpService.patch(url, updateData, {
          headers: {
            token: this.apiKey,
            'Content-Type': 'application/json',
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error al actualizar afiliado en Bonda:', error.message);

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
  ): Promise<BondaDeleteResponse> {
    if (this.useMocks) {
      return this.eliminarAfiliadoMock(affiliateCode);
    }

    try {
      const url = `${this.apiUrl}/api/v2/microsite/${this.micrositeId}/affiliates/${affiliateCode}`;

      const response = await firstValueFrom(
        this.httpService.delete(url, {
          headers: {
            token: this.apiKey,
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

  private eliminarAfiliadoMock(
    affiliateCode: string,
  ): BondaDeleteResponse {
    this.logger.log(`[MOCK] Eliminando afiliado: ${affiliateCode}`);

    return {
      success: true,
      data: {
        deleted: 1,
      },
    };
  }
}
