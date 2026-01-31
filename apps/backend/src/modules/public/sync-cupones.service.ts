import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BondaService } from '../bonda/bonda.service';
import { SupabaseService } from '../supabase/supabase.service';
import { ConfigService } from '@nestjs/config';

/**
 * Servicio para sincronizar cupones de Bonda a public_coupons periódicamente.
 * Actualiza la tabla cada 6 horas con cupones reales de Bonda (sin códigos).
 * Usa rotación round-robin entre micrositios activos.
 */
@Injectable()
export class SyncCuponesService {
  private readonly logger = new Logger(SyncCuponesService.name);

  // Código de afiliado demo público de Bonda (proporcionado por Bonda para testing)
  private readonly DEMO_AFFILIATE_CODE = '22380612';

  constructor(
    private readonly bondaService: BondaService,
    private readonly supabase: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Cron que se ejecuta cada 6 horas para sincronizar cupones.
   * Usa round-robin para rotar entre micrositios activos.
   * También se puede ejecutar manualmente llamando a este método.
   */
  @Cron(CronExpression.EVERY_6_HOURS, {
    name: 'sync-cupones-bonda',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
  async syncCuponesFromBonda() {
    let micrositeId: string | null = null;

    try {
      this.logger.log('🔄 Iniciando sync de cupones desde Bonda (round-robin)...');

      // Obtener el siguiente micrositio en la rotación round-robin
      const microsite = await this.supabase.getNextMicrositeForSync();

      if (!microsite) {
        this.logger.error(
          '❌ No hay micrositios activos disponibles para sync. Verificar tabla bonda_microsites.',
        );
        return;
      }

      micrositeId = microsite.id;
      const lastSync = microsite.last_synced_at
        ? new Date(microsite.last_synced_at).toLocaleString('es-AR')
        : 'nunca';

      this.logger.log(
        `📡 Micrositio seleccionado: "${microsite.nombre}" (${microsite.slug})`,
      );
      this.logger.log(`   Última sincronización: ${lastSync}`);
      this.logger.log(
        `   Usando código de afiliado demo: ${this.DEMO_AFFILIATE_CODE}`,
      );

      // Llamar a Bonda para obtener cupones reales del micrositio seleccionado
      const bondaCupones = await this.bondaService.obtenerCupones(
        this.DEMO_AFFILIATE_CODE,
        { slug: microsite.slug },
      );

      if (!bondaCupones || !bondaCupones.cupones) {
        this.logger.warn(
          `⚠️ No se obtuvieron cupones de Bonda para micrositio "${microsite.nombre}"`,
        );
        return;
      }

      this.logger.log(
        `📦 Recibidos ${bondaCupones.cupones.length} cupones de Bonda`,
      );

      // Borrar cupones viejos de public_coupons
      const { error: deleteError } = await this.supabase
        .from('public_coupons')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deleteError) {
        this.logger.error('❌ Error al borrar cupones viejos:', deleteError);
        throw deleteError;
      }

      // Preparar cupones para insertar (SIN códigos, solo info general)
      const cuponesParaInsertar = bondaCupones.cupones.map((c, idx) => {
        return {
          titulo: c.nombre,
          descripcion: `${c.descuento} de descuento en ${c.empresa.nombre}`,
          descuento: c.descuento,
          imagen_url:
            c.imagenes.principal?.['280x190'] ||
            c.imagenes.thumbnail?.['90x90'] ||
            c.empresa.logoThumbnail?.['90x90'] ||
            null,
          empresa: c.empresa.nombre,
          categoria: 'beneficios', // Categoría genérica (puede personalizarse después)
          orden: idx + 1,
          activo: true,
        };
      });

      // Insertar cupones nuevos en public_coupons
      const { error: insertError } = await this.supabase
        .from('public_coupons')
        .insert(cuponesParaInsertar);

      if (insertError) {
        this.logger.error('❌ Error al insertar cupones nuevos:', insertError);
        throw insertError;
      }

      // ✅ Sync exitoso: actualizar last_synced_at del micrositio
      await this.supabase.updateMicrositeLastSynced(micrositeId);

      this.logger.log(
        `✅ Sync completado exitosamente: ${cuponesParaInsertar.length} cupones de "${microsite.nombre}"`,
      );
    } catch (error) {
      this.logger.error('❌ Error crítico en sync de cupones:', error);
      // NO actualizar last_synced_at si el sync falló
      // El micrositio se intentará de nuevo en el próximo ciclo
      // No lanzar el error para que el cron pueda seguir ejecutándose
    }
  }

  /**
   * Ejecutar sync manualmente (útil para pruebas o para forzar actualización).
   * Llamar desde un endpoint si se necesita trigger manual.
   */
  async syncManual() {
    this.logger.log('🔧 Sync manual solicitado');
    return this.syncCuponesFromBonda();
  }
}
