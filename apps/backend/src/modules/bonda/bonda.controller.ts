import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { BondaService } from './bonda.service';
import { GetCuponesQueryDto } from './dto/get-cupones-query.dto';
import { CuponesResponseDto } from './dto/cupones-response.dto';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
import { UpdateAffiliateDto } from './dto/update-affiliate.dto';
import {
  BondaAffiliateResponse,
  BondaDeleteResponse,
} from './dto/affiliate-response.dto';

@Controller('bonda')
@UseInterceptors(ClassSerializerInterceptor)
export class BondaController {
  constructor(private readonly bondaService: BondaService) {}

  // ========================================
  // ENDPOINTS PARA CUPONES
  // ========================================

  @Get('cupones/:codigoAfiliado')
  async obtenerCupones(
    @Param('codigoAfiliado') codigoAfiliado: string,
  ): Promise<CuponesResponseDto> {
    return this.bondaService.obtenerCupones(codigoAfiliado);
  }

  // ========================================
  // ENDPOINTS PARA GESTIÓN DE AFILIADOS
  // ========================================

  /**
   * Crear un nuevo afiliado en Bonda
   * POST /api/bonda/affiliates
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
  ): Promise<BondaAffiliateResponse> {
    return this.bondaService.crearAfiliado(createAffiliateDto);
  }

  /**
   * Actualizar un afiliado existente en Bonda
   * PATCH /api/bonda/affiliates/:code
   * 
   * Solo se envían los campos que se desean actualizar.
   * El campo "code" NO puede ser actualizado.
   */
  @Patch('affiliates/:code')
  async actualizarAfiliado(
    @Param('code') code: string,
    @Body() updateAffiliateDto: UpdateAffiliateDto,
  ): Promise<BondaAffiliateResponse> {
    return this.bondaService.actualizarAfiliado(code, updateAffiliateDto);
  }

  /**
   * Eliminar un afiliado de Bonda
   * DELETE /api/bonda/affiliates/:code
   * 
   * Soft delete por 30 días.
   * Si se crea nuevamente con el mismo code dentro de ese período, será restaurado.
   */
  @Delete('affiliates/:code')
  async eliminarAfiliado(
    @Param('code') code: string,
  ): Promise<BondaDeleteResponse> {
    return this.bondaService.eliminarAfiliado(code);
  }
}
