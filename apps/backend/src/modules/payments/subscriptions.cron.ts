import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseService } from '../supabase/supabase.service';
import { FiservRestService } from './fiserv-rest/fiserv-rest.service';

@Injectable()
export class SubscriptionsCronService {
  private readonly logger = new Logger(SubscriptionsCronService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly fiservRestService: FiservRestService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async procesarSuscripcionesDiarias() {
    this.logger.log('Iniciando cron de procesamiento de suscripciones...');
    try {
      const subscriptions = await this.supabaseService.getDueSubscriptions();
      
      if (!subscriptions || subscriptions.length === 0) {
        this.logger.log('No hay suscripciones pendientes de cobro para hoy.');
        return;
      }

      this.logger.log(`Encontradas ${subscriptions.length} suscripciones para procesar.`);

      for (const sub of subscriptions) {
        try {
          this.logger.log(`Procesando suscripción ${sub.id} del usuario ${sub.usuario_id}...`);
          
          // La storeId se toma de la organización si la tiene configurada. 
          // Ojo: en fiservRestService se pasa como último argumento.
          const storeId = sub.organizaciones?.fiserv_store_id || '5927306113254'; 
          
          const result = await this.fiservRestService.processRecurringPayment(
            sub.usuario_id,
            sub.payment_method_id,
            sub.monto,
            storeId
          );

          if (result.transactionStatus === 'APPROVED') {
            this.logger.log(`Cobro exitoso para suscripción ${sub.id}`);
            
            // Registrar donación
            await this.supabaseService.createDonacion({
              usuario_id: sub.usuario_id,
              monto: sub.monto,
              moneda: sub.moneda,
              metodo_pago: 'fiserv-rest-recurring',
              organizacion_id: sub.organizacion_id,
              organizacion_nombre: sub.organizaciones?.nombre,
              estado: 'completada',
              payment_id: result.ipgTransactionId || undefined,
              payment_status: result.transactionStatus,
            });

            // Actualizar suscripción (sumar 1 mes)
            const today = new Date();
            const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
            const fechaProximoCobro = nextMonth.toISOString().split('T')[0];

            await this.supabaseService.updateSuscripcion(sub.id, {
              fecha_proximo_cobro: fechaProximoCobro,
              reintentos: 0,
            });

          } else {
            throw new Error(`Estado de transacción no aprobado: ${result.transactionStatus}`);
          }

        } catch (error: any) {
          this.logger.error(`Error procesando suscripción ${sub.id}:`, error.message || error);
          
          const maxReintentos = 3;
          const nuevosReintentos = (sub.reintentos || 0) + 1;
          
          if (nuevosReintentos >= maxReintentos) {
            this.logger.warn(`Suscripción ${sub.id} suspendida tras ${maxReintentos} intentos fallidos.`);
            await this.supabaseService.updateSuscripcion(sub.id, {
              estado: 'fallida',
              reintentos: nuevosReintentos,
            });
          } else {
            await this.supabaseService.updateSuscripcion(sub.id, {
              reintentos: nuevosReintentos,
            });
          }
        }
      }
      this.logger.log('Cron de suscripciones finalizado con éxito.');
    } catch (error) {
      this.logger.error('Error general en el cron de suscripciones:', error);
    }
  }
}
