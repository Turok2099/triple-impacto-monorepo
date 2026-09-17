import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseService } from '../supabase/supabase.service';
import { FiservRestService } from './fiserv-rest/fiserv-rest.service';
import { MailService } from '../mail/mail.service';

const MAX_REINTENTOS = 3;

@Injectable()
export class SubscriptionsCronService {
  private readonly logger = new Logger(SubscriptionsCronService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly fiservRestService: FiservRestService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Suspende los beneficios de Bonda del usuario para esa organización sin
   * eliminar al afiliado en Bonda: el usuario permanece dado de alta ahí,
   * solo se marca inactivo localmente (es lo que usa el resto de la app para
   * habilitar/bloquear el uso de cupones).
   */
  private async suspenderBeneficiosBonda(
    usuarioId: string,
    organizacionId: string,
  ) {
    const bondaMicrosite =
      await this.supabaseService.getBondaMicrositeByOrganizacionId(
        organizacionId,
      );
    if (!bondaMicrosite) return;

    const { error } = await this.supabaseService
      .getClient()
      .from('usuarios_bonda_afiliados')
      .update({ is_active: false })
      .eq('user_id', usuarioId)
      .eq('bonda_microsite_id', bondaMicrosite.id);

    if (error) {
      this.logger.error(
        `Error suspendiendo beneficios locales de Bonda para usuario ${usuarioId}:`,
        error,
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async procesarSuscripcionesDiarias() {
    this.logger.log('Iniciando cron de procesamiento de suscripciones...');
    try {
      const subscriptions = await this.supabaseService.getDueSubscriptions();

      if (!subscriptions || subscriptions.length === 0) {
        this.logger.log('No hay suscripciones pendientes de cobro para hoy.');
        return;
      }

      this.logger.log(
        `Encontradas ${subscriptions.length} suscripciones para procesar.`,
      );

      for (const sub of subscriptions) {
        try {
          this.logger.log(
            `Procesando suscripción ${sub.id} del usuario ${sub.usuario_id}...`,
          );

          // La storeId se toma de la organización si la tiene configurada.
          // Ojo: en fiservRestService se pasa como último argumento.
          const storeId =
            sub.organizaciones?.fiserv_store_id || '5927306113254';

          const result = await this.fiservRestService.processRecurringPayment(
            sub.usuario_id,
            sub.payment_method_id,
            sub.monto,
            storeId,
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
            const nextMonth = new Date(
              today.getFullYear(),
              today.getMonth() + 1,
              today.getDate(),
            );
            const fechaProximoCobro = nextMonth.toISOString().split('T')[0];

            await this.supabaseService.updateSuscripcion(sub.id, {
              fecha_proximo_cobro: fechaProximoCobro,
              reintentos: 0,
            });
          } else {
            throw new Error(
              `Estado de transacción no aprobado: ${result.transactionStatus}`,
            );
          }
        } catch (error: any) {
          this.logger.error(
            `Error procesando suscripción ${sub.id}:`,
            error.message || error,
          );

          const nuevosReintentos = (sub.reintentos || 0) + 1;
          const userEmail = sub.usuarios?.email;
          const userName = sub.usuarios?.nombre || 'Donante';
          const orgName = sub.organizaciones?.nombre || 'la organización';

          if (nuevosReintentos >= MAX_REINTENTOS) {
            this.logger.warn(
              `Suscripción ${sub.id} suspendida tras ${MAX_REINTENTOS} intentos fallidos.`,
            );
            await this.supabaseService.updateSuscripcion(sub.id, {
              estado: 'fallida',
              reintentos: nuevosReintentos,
            });

            // Impago definitivo: se suspenden los beneficios de Bonda.
            // El afiliado NO se borra de Bonda, solo se marca inactivo localmente.
            await this.suspenderBeneficiosBonda(
              sub.usuario_id,
              sub.organizacion_id,
            );

            if (userEmail) {
              this.mailService
                .sendSubscriptionCancelledEmail(userEmail, userName, orgName)
                .catch((err) =>
                  this.logger.error(
                    `Error enviando correo de suspensión para suscripción ${sub.id}:`,
                    err,
                  ),
                );
            }
          } else {
            await this.supabaseService.updateSuscripcion(sub.id, {
              reintentos: nuevosReintentos,
            });

            if (userEmail) {
              this.mailService
                .sendSubscriptionPaymentFailedEmail(
                  userEmail,
                  userName,
                  orgName,
                  nuevosReintentos,
                  MAX_REINTENTOS,
                )
                .catch((err) =>
                  this.logger.error(
                    `Error enviando aviso de cobro fallido para suscripción ${sub.id}:`,
                    err,
                  ),
                );
            }
          }
        }
      }
      this.logger.log('Cron de suscripciones finalizado con éxito.');
    } catch (error) {
      this.logger.error('Error general en el cron de suscripciones:', error);
    }
  }
}
