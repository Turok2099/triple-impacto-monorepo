import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SupabaseService } from '../supabase/supabase.service';
import { BondaService } from './bonda.service';
import { CuponesResponseDto } from './dto/cupones-response.dto';
import { CuponDto } from './dto/cupon.dto';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
import { UpdateAffiliateDto } from './dto/update-affiliate.dto';
import {
  BondaAffiliateResponse,
  BondaDeleteResponse,
} from './dto/affiliate-response.dto';

/** Query params opcionales para resolver micrositio Bonda por slug u organizacion_id */
export interface BondaMicrositeQuery {
  microsite?: string;
  organizacion_id?: string;
}

/** Quita de envio los campos sensibles (Estado 2 – usuario registrado sin pagar). */
function filtrarEnvioSensible(cupon: CuponDto): CuponDto {
  if (!cupon.envio) return cupon;
  const { codigo, codigoId, smsId, mensaje, ...envioResto } = cupon.envio;
  return {
    ...cupon,
    envio: { ...envioResto, codigoId: '', codigo: null, smsId: undefined, mensaje: undefined },
  };
}

@Controller('bonda')
@UseInterceptors(ClassSerializerInterceptor)
export class BondaController {
  constructor(
    private readonly bondaService: BondaService,
    private readonly supabase: SupabaseService,
  ) {}

  // ========================================
  // ENDPOINTS PARA CUPONES
  // ========================================
  //
  // Preferir GET /bonda/cupones?microsite=slug (resuelve código por user+micrositio).
  // GET /bonda/cupones/:codigoAfiliado queda para compatibilidad cuando se envía el código explícito.

  /**
   * Cupones del usuario logueado para un micrositio/ONG.
   * Requiere microsite (slug) u organizacion_id. Resuelve el affiliate_code desde usuarios_bonda_afiliados.
   */
  @Get('cupones')
  @UseGuards(JwtAuthGuard)
  async obtenerCuponesPorUsuario(
    @Req() req: Request & { user?: { userId: string } },
    @Query('microsite') microsite?: string,
    @Query('organizacion_id') organizacionId?: string,
  ): Promise<CuponesResponseDto> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('Se requiere autenticación');
    }

    if (!microsite && !organizacionId) {
      throw new BadRequestException(
        'Se requiere microsite (slug) u organizacion_id',
      );
    }

    const micrositeRow = microsite
      ? await this.supabase.getBondaMicrositeBySlug(microsite)
      : await this.supabase.getBondaMicrositeByOrganizacionId(
          organizacionId!,
        );

    if (!micrositeRow) {
      throw new NotFoundException(
        microsite
          ? `Micrositio no encontrado: ${microsite}`
          : `Micrositio no encontrado para organizacion_id=${organizacionId}`,
      );
    }

    const afiliado = await this.supabase.getAffiliateForUserAndMicrosite(
      userId,
      micrositeRow.id,
    );

    if (!afiliado) {
      throw new NotFoundException(
        'Complete una donación en esta ONG para acceder a cupones',
      );
    }

    const response = await this.bondaService.obtenerCupones(
      afiliado.affiliate_code,
      { slug: microsite ?? micrositeRow.slug, organizacionId },
    );

    const hasPaid = await this.supabase.hasUserPaid(userId);
    if (!hasPaid) {
      return {
        count: response.count,
        cupones: response.cupones.map(filtrarEnvioSensible),
      };
    }
    return response;
  }

  /**
   * Cupones usando código de afiliado explícito (compatibilidad / admin).
   * Query: microsite (slug) u organizacion_id para config Bonda.
   */
  @Get('cupones/:codigoAfiliado')
  @UseGuards(JwtAuthGuard)
  async obtenerCuponesConCodigo(
    @Param('codigoAfiliado') codigoAfiliado: string,
    @Req() req: Request & { user?: { userId: string } },
    @Query('microsite') microsite?: string,
    @Query('organizacion_id') organizacionId?: string,
  ): Promise<CuponesResponseDto> {
    const response = await this.bondaService.obtenerCupones(codigoAfiliado, {
      slug: microsite,
      organizacionId,
    });

    const userId = req.user?.userId;
    if (userId) {
      const hasPaid = await this.supabase.hasUserPaid(userId);
      if (!hasPaid) {
        return {
          count: response.count,
          cupones: response.cupones.map(filtrarEnvioSensible),
        };
      }
    }

    return response;
  }

  // ========================================
  // ENDPOINTS PARA GESTIÓN DE AFILIADOS
  // ========================================

  /**
   * Crear un nuevo afiliado en Bonda
   * POST /api/bonda/affiliates
   * Query: microsite (slug) u organizacion_id para usar config desde bonda_microsites.
   *
   * Body:
   * {
   *   "code": "usuario123",  // REQUERIDO
   *   "email": "usuario@example.com",
   *   "nombre": "Juan Pérez",
   *   "telefono": "+54 9 11 1234-5678",
   *   "provincia": "Buenos Aires",
   *   "localidad": "CABA"
   * }
   */
  @Post('affiliates')
  async crearAfiliado(
    @Body() createAffiliateDto: CreateAffiliateDto,
    @Query('microsite') microsite?: string,
    @Query('organizacion_id') organizacionId?: string,
  ): Promise<BondaAffiliateResponse> {
    return this.bondaService.crearAfiliado(createAffiliateDto, {
      slug: microsite,
      organizacionId,
    });
  }

  /**
   * Actualizar un afiliado existente en Bonda
   * PATCH /api/bonda/affiliates/:code
   * Query: microsite (slug) u organizacion_id para usar config desde bonda_microsites.
   *
   * Solo se envían los campos que se desean actualizar.
   * El campo "code" NO puede ser actualizado.
   */
  @Patch('affiliates/:code')
  async actualizarAfiliado(
    @Param('code') code: string,
    @Body() updateAffiliateDto: UpdateAffiliateDto,
    @Query('microsite') microsite?: string,
    @Query('organizacion_id') organizacionId?: string,
  ): Promise<BondaAffiliateResponse> {
    return this.bondaService.actualizarAfiliado(code, updateAffiliateDto, {
      slug: microsite,
      organizacionId,
    });
  }

  /**
   * Eliminar un afiliado de Bonda
   * DELETE /api/bonda/affiliates/:code
   * Query: microsite (slug) u organizacion_id para usar config desde bonda_microsites.
   *
   * Soft delete por 30 días.
   * Si se crea nuevamente con el mismo code dentro de ese período, será restaurado.
   */
  @Delete('affiliates/:code')
  async eliminarAfiliado(
    @Param('code') code: string,
    @Query('microsite') microsite?: string,
    @Query('organizacion_id') organizacionId?: string,
  ): Promise<BondaDeleteResponse> {
    return this.bondaService.eliminarAfiliado(code, {
      slug: microsite,
      organizacionId,
    });
  }
}
