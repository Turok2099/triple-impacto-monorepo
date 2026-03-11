import {
  Controller,
  Post,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { SyncService } from './sync.service';
import { ConfigService } from '@nestjs/config';

/**
 * Controlador para sincronización manual de cupones desde Bonda
 *
 * ⚠️ ENDPOINTS PROTEGIDOS: Requieren un secret token para ejecutarse
 */
@Controller('sync')
export class SyncController {
  constructor(
    private readonly syncService: SyncService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Sincronizar cupones de un micrositio específico o el siguiente en la cola
   * POST /api/sync/cupones?secret=xxxxx
   *
   * Query params:
   * - secret: Token de seguridad (SYNC_SECRET del .env)
   * - microsite_id: (Opcional) ID del micrositio a sincronizar
   */
  @Post('cupones')
  @HttpCode(HttpStatus.OK)
  async sincronizarCupones(
    @Query('secret') secret: string,
    @Query('microsite_id') micrositeId?: string,
  ) {
    // Validar secret token
    const syncSecret = this.configService.get<string>('SYNC_SECRET');
    if (!syncSecret || secret !== syncSecret) {
      return {
        success: false,
        message: 'Token de seguridad inválido',
      };
    }

    try {
      const resultado =
        await this.syncService.sincronizarCuponesDesdeBonda(micrositeId);

      return {
        success: true,
        message: 'Sincronización completada exitosamente',
        data: resultado,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error en sincronización',
        error: error.message,
      };
    }
  }

  /**
   * Sincronizar todos los micrositios activos
   * POST /api/sync/todos?secret=xxxxx
   */
  @Post('todos')
  @HttpCode(HttpStatus.OK)
  async sincronizarTodos(@Query('secret') secret: string) {
    const syncSecret = this.configService.get<string>('SYNC_SECRET');
    if (!syncSecret || secret !== syncSecret) {
      return {
        success: false,
        message: 'Token de seguridad inválido',
      };
    }

    try {
      const resultado = await this.syncService.sincronizarTodosMicrositios();

      return {
        success: true,
        message: 'Sincronización de todos los micrositios completada',
        data: resultado,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error en sincronización masiva',
        error: error.message,
      };
    }
  }

  /**
   * Verificar estado de sincronización
   * GET /api/sync/status?secret=xxxxx
   */
  @Get('status')
  async getEstadoSincronizacion(@Query('secret') secret: string) {
    const syncSecret = this.configService.get<string>('SYNC_SECRET');
    if (!syncSecret || secret !== syncSecret) {
      return {
        success: false,
        message: 'Token de seguridad inválido',
      };
    }

    try {
      // Obtener estadísticas desde Supabase
      const stats =
        await this.syncService['supabaseService'].getEstadisticasCuponesV2();

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al obtener estadísticas',
        error: error.message,
      };
    }
  }
}
