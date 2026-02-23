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
import { SolicitarCuponDto } from './dto/solicitar-cupon.dto';
import {
  CuponSolicitadoDto,
  DashboardUsuarioDto,
  EstadisticasUsuarioDto,
} from './dto/cupon-solicitado.dto';
import {
  HistorialCuponesDto,
  HistorialCuponesQueryDto,
} from './dto/historial-cupones.dto';

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

  /**
   * Obtiene los cupones recibidos/solicitados por el usuario (últimos 25).
   * Llama al endpoint /api/cupones_recibidos de Bonda.
   * GET /api/bonda/cupones-recibidos?microsite=slug
   */
  @Get('cupones-recibidos')
  @UseGuards(JwtAuthGuard)
  async obtenerCuponesRecibidos(
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
        `Micrositio no encontrado: ${microsite || organizacionId}`,
      );
    }

    const affiliateRow = await this.supabase.getAffiliateBondaByUser(
      userId,
      micrositeRow.id,
    );

    if (!affiliateRow) {
      throw new NotFoundException(
        `No se encontró código de afiliado para este usuario en el micrositio: ${micrositeRow.nombre}`,
      );
    }

    return this.bondaService.obtenerCuponesRecibidos(
      affiliateRow.affiliate_code,
      { slug: microsite, organizacionId },
    );
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

  /**
   * GET /api/bonda/affiliates/:code
   * Query: microsite (slug) u organizacion_id para usar config desde bonda_microsites.
   * 
   * Obtiene un afiliado por su código desde Bonda API.
   * Retorna el usuario completo incluyendo member, segmentation y company.
   * 
   * Si el usuario se encuentra soft-deleteado, retorna 404 (null).
   */
  @Get('affiliates/:code')
  async obtenerAfiliado(
    @Param('code') code: string,
    @Query('microsite') microsite?: string,
    @Query('organizacion_id') organizacionId?: string,
  ): Promise<any> {
    return this.bondaService.obtenerAfiliado(code, {
      slug: microsite,
      organizacionId,
    });
  }

  // ========================================
  // ENDPOINTS PARA DASHBOARD DE USUARIO
  // ========================================

  /**
   * Solicitar un cupón específico de Bonda
   * POST /api/bonda/solicitar-cupon
   * 
   * El usuario solicita un cupón y se guarda en su dashboard con el código visible
   */
  @Post('solicitar-cupon')
  @UseGuards(JwtAuthGuard)
  async solicitarCupon(
    @Req() req: Request & { user?: { userId: string } },
    @Body() solicitarDto: SolicitarCuponDto,
  ): Promise<CuponSolicitadoDto> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('Se requiere autenticación');
    }

    // Solicitar el cupón a través del servicio
    const cuponGuardado = await this.bondaService.solicitarCuponEspecifico(
      userId,
      solicitarDto.bondaCuponId,
      solicitarDto.codigoAfiliado,
      solicitarDto.micrositioSlug,
      solicitarDto.celular,
    );

    // Transformar a DTO de respuesta
    return this.transformarACuponSolicitadoDto(cuponGuardado);
  }

  /**
   * Obtener cupones activos del usuario (dashboard)
   * GET /api/bonda/mis-cupones
   * 
   * Retorna los cupones que el usuario ha solicitado y están activos
   */
  @Get('mis-cupones')
  @UseGuards(JwtAuthGuard)
  async obtenerMisCupones(
    @Req() req: Request & { user?: { userId: string } },
  ): Promise<CuponSolicitadoDto[]> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('Se requiere autenticación');
    }

    const cupones = await this.supabase.getCuponesActivosUsuario(userId);

    return cupones.map(this.transformarACuponSolicitadoDto);
  }

  /**
   * Obtener historial completo de cupones del usuario
   * GET /api/bonda/historial-cupones
   * 
   * Retorna el historial paginado de todos los cupones solicitados
   */
  @Get('historial-cupones')
  @UseGuards(JwtAuthGuard)
  async obtenerHistorialCupones(
    @Req() req: Request & { user?: { userId: string } },
    @Query('pagina') pagina?: number,
    @Query('limite') limite?: number,
    @Query('estado') estado?: 'activo' | 'usado' | 'vencido' | 'cancelado' | 'todos',
  ): Promise<HistorialCuponesDto> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('Se requiere autenticación');
    }

    const resultado = await this.supabase.getHistorialCuponesUsuario(userId, {
      pagina: pagina ? Number(pagina) : 1,
      limite: limite ? Number(limite) : 20,
      estado: estado || 'todos',
    });

    return {
      cupones: resultado.cupones.map(this.transformarACuponSolicitadoDto),
      total: resultado.total,
      pagina: resultado.pagina,
      limite: resultado.limite,
      totalPaginas: resultado.totalPaginas,
    };
  }

  /**
   * Obtener dashboard completo del usuario
   * GET /api/bonda/dashboard
   * 
   * Retorna estadísticas, cupones activos, recientes y fundaciones
   */
  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  async obtenerDashboard(
    @Req() req: Request & { user?: { userId: string } },
  ): Promise<DashboardUsuarioDto> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('Se requiere autenticación');
    }

    try {
      // Obtener información del usuario
      const usuario = await this.supabase.findUserById(userId);
      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Obtener estadísticas (con manejo de errores)
      let stats;
      try {
        stats = await this.supabase.getEstadisticasCuponesUsuario(userId);
      } catch (error) {
        console.warn('Error al obtener estadísticas, usando valores por defecto:', error);
        stats = {
          cupones_activos: 0,
          cupones_usados: 0,
          total_cupones_solicitados: 0,
          ultimo_cupon_solicitado: null,
        };
      }

      // Obtener total donado (con manejo de errores)
      let totalDonado = 0;
      try {
        totalDonado = await this.supabase.getTotalDonadoUsuario(userId);
      } catch (error) {
        console.warn('Error al obtener total donado, usando 0:', error);
      }

      // Obtener fundaciones a las que ha donado (micrositios activos del usuario)
      let fundaciones: any[] = [];
      try {
        fundaciones = await this.supabase.getFundacionesUsuario(userId);
      } catch (error) {
        console.warn('Error al obtener fundaciones, usando array vacío:', error);
      }

      // Obtener cupones activos (con manejo de errores)
      let cuponesActivos: any[] = [];
      try {
        cuponesActivos = await this.supabase.getCuponesActivosUsuario(userId);
      } catch (error) {
        console.warn('Error al obtener cupones activos, usando array vacío:', error);
      }

      // Obtener últimos 5 cupones (con manejo de errores)
      let historialReciente: any = { cupones: [], total: 0, pagina: 1, limite: 5, totalPaginas: 0 };
      try {
        historialReciente = await this.supabase.getHistorialCuponesUsuario(
          userId,
          { pagina: 1, limite: 5 },
        );
      } catch (error) {
        console.warn('Error al obtener historial reciente, usando array vacío:', error);
      }

      return {
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
        },
        estadisticas: {
          cuponesActivos: stats.cupones_activos || 0,
          cuponesUsados: stats.cupones_usados || 0,
          totalCuponesSolicitados: stats.total_cupones_solicitados || 0,
          ultimoCuponSolicitado: stats.ultimo_cupon_solicitado,
          totalDonado,
        },
        fundaciones: fundaciones.map((f) => ({
          id: f.bonda_microsite_id,
          nombre: f.micrositio_nombre,
          codigoAfiliado: f.affiliate_code,
          fechaAfiliacion: f.created_at,
        })),
        cuponesActivos: cuponesActivos.map(this.transformarACuponSolicitadoDto),
        cuponesRecientes: historialReciente.cupones.map(
          this.transformarACuponSolicitadoDto,
        ),
      };
    } catch (error) {
      console.error('Error crítico en obtenerDashboard:', error);
      throw error;
    }
  }

  /**
   * Marcar un cupón como usado
   * PATCH /api/bonda/cupones/:id/usar
   */
  @Patch('cupones/:id/usar')
  @UseGuards(JwtAuthGuard)
  async marcarCuponComoUsado(
    @Req() req: Request & { user?: { userId: string } },
    @Param('id') cuponId: string,
  ): Promise<{ success: boolean; message: string }> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('Se requiere autenticación');
    }

    const resultado = await this.supabase.marcarCuponComoUsado(cuponId, userId);

    if (!resultado) {
      throw new BadRequestException(
        'No se pudo marcar el cupón como usado. Verifica que sea tuyo y esté activo.',
      );
    }

    return {
      success: true,
      message: 'Cupón marcado como usado exitosamente',
    };
  }

  // ========================================
  // MÉTODO AUXILIAR PARA TRANSFORMACIÓN
  // ========================================

  /**
   * Transforma el objeto de BD a DTO de respuesta
   */
  private transformarACuponSolicitadoDto(cupon: any): CuponSolicitadoDto {
    return {
      id: cupon.id,
      bondaCuponId: cupon.bonda_cupon_id,
      nombre: cupon.nombre,
      descuento: cupon.descuento,
      empresaNombre: cupon.empresa_nombre,
      empresaId: cupon.empresa_id,
      codigo: cupon.codigo,
      codigoId: cupon.codigo_id,
      estado: cupon.estado,
      usadoAt: cupon.usado_at,
      mensaje: cupon.mensaje,
      operadora: cupon.operadora,
      celular: cupon.celular,
      imagenThumbnail: cupon.imagen_thumbnail,
      imagenPrincipal: cupon.imagen_principal,
      imagenApaisada: cupon.imagen_apaisada,
      createdAt: cupon.created_at,
      updatedAt: cupon.updated_at,
      expiresAt: cupon.expires_at,
      micrositioSlug: cupon.micrositio_slug,
    };
  }
}
