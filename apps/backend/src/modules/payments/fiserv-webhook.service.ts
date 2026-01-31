import { Injectable, Logger } from '@nestjs/common';
import { validateNotificationHash } from './fiserv-connect/utils/connect-hash.util';
import { FiservConnectService } from './fiserv-connect/fiserv-connect.service';
import { SupabaseService } from '../supabase/supabase.service';
import { BondaService } from './../bonda/bonda.service';

/**
 * Payload de la notificación servidor a servidor de Fiserv Connect.
 * POST application/x-www-form-urlencoded; incluye los mismos params que la redirección
 * más merchantTransactionId, oid, approval_code, ipgTransactionId, notification_hash, etc.
 */
export type FiservNotificationBody = Record<
  string,
  string | string[] | undefined
>;

@Injectable()
export class FiservWebhookService {
  private readonly logger = new Logger(FiservWebhookService.name);

  constructor(
    private readonly fiservConnect: FiservConnectService,
    private readonly supabase: SupabaseService,
    private readonly bonda: BondaService,
  ) {}

  /**
   * Procesa la notificación de pago de Fiserv.
   * Valida el hash, actualiza payment_attempt, crea donación y afiliado Bonda si corresponde.
   */
  async handleNotification(body: FiservNotificationBody): Promise<void> {
    const str = (v: string | string[] | undefined) =>
      Array.isArray(v) ? (v[0] ?? '') : (v ?? '');

    const oid = str(body.oid) || str(body.merchantTransactionId);
    const chargetotal = str(body.chargetotal);
    const currency = str(body.currency);
    const txndatetime = str(body.txndatetime);
    const storename = str(body.storename);
    const approvalCode = str(body.approval_code);
    const notificationHash = str(body.notification_hash) || str(body.hash);
    const ipgTransactionId = str(body.ipgTransactionId);

    // Sin approval_code o sin oid: no es un éxito o no podemos vincular el pago
    if (!approvalCode || !oid) {
      this.logger.warn(
        'Fiserv notification: sin approval_code u oid, se ignora',
      );
      return;
    }

    const config = this.fiservConnect.getConfig();
    if (!config) {
      this.logger.warn('Fiserv notification: config no disponible');
      return;
    }

    if (!notificationHash) {
      this.logger.warn('Fiserv notification: sin notification_hash');
      return;
    }

    const hashValid = validateNotificationHash(
      chargetotal,
      currency,
      txndatetime,
      storename,
      approvalCode,
      notificationHash,
      config.sharedSecret,
    );
    if (!hashValid) {
      this.logger.warn('Fiserv notification: hash inválido');
      throw new Error('Hash de notificación inválido');
    }

    const attempt = await this.supabase.getPaymentAttemptByOrderId(oid);
    if (!attempt) {
      this.logger.warn(
        `Fiserv notification: payment_attempt no encontrado oid=${oid}`,
      );
      return;
    }

    if (attempt.status === 'completed') {
      this.logger.log(
        `Fiserv notification: intento ya completado id=${attempt.id}`,
      );
      return;
    }

    await this.supabase.updatePaymentAttempt(attempt.id, {
      status: 'completed',
      fiserv_raw_response: body as Record<string, unknown>,
    });

    const monto = parseFloat(chargetotal) || Number(attempt.amount) || 0;
    const organizacionNombre = attempt.organizacion_id
      ? await this.getOrganizacionNombre(attempt.organizacion_id)
      : undefined;

    await this.supabase.createDonacion({
      usuario_id: attempt.user_id,
      monto,
      moneda: currency || attempt.currency || 'ARS',
      metodo_pago: 'fiserv',
      organizacion_id: attempt.organizacion_id ?? undefined,
      organizacion_nombre: organizacionNombre,
      estado: 'completada',
      payment_id: ipgTransactionId || undefined,
      payment_status: approvalCode,
    });

    if (attempt.organizacion_id) {
      await this.ensureBondaAffiliateForUserAndOrganisation(
        attempt.user_id,
        attempt.organizacion_id,
      );
    }

    this.logger.log(
      `Fiserv notification: pago completado user=${attempt.user_id} oid=${oid}`,
    );
  }

  private async getOrganizacionNombre(
    organizacionId: string,
  ): Promise<string | undefined> {
    const { data } = await this.supabase
      .from('organizaciones')
      .select('nombre')
      .eq('id', organizacionId)
      .maybeSingle();
    return data?.nombre;
  }

  /**
   * Crea el afiliado en Bonda para (user, micrositio de la ONG) si aún no existe.
   */
  private async ensureBondaAffiliateForUserAndOrganisation(
    userId: string,
    organizacionId: string,
  ): Promise<void> {
    const microsite =
      await this.supabase.getBondaMicrositeByOrganizacionId(organizacionId);
    if (!microsite) {
      this.logger.warn(
        `Fiserv webhook: no hay micrositio Bonda para organizacion_id=${organizacionId}`,
      );
      return;
    }

    const existing = await this.supabase.getAffiliateForUserAndMicrosite(
      userId,
      microsite.id,
    );
    if (existing) {
      return;
    }

    const user = await this.supabase.findUserById(userId);
    if (!user) {
      this.logger.warn(`Fiserv webhook: usuario no encontrado id=${userId}`);
      return;
    }

    const code = this.generateAffiliateCode(user.email);
    try {
      const res = await this.bonda.crearAfiliado(
        {
          code,
          email: user.email,
          nombre: user.nombre ?? undefined,
          telefono: user.telefono ?? undefined,
          provincia: user.provincia ?? undefined,
          localidad: user.localidad ?? undefined,
        },
        { organizacionId },
      );

      if (res?.success && res?.data?.code) {
        await this.supabase.upsertAffiliateForUser(
          userId,
          microsite.id,
          res.data.code,
        );
        this.logger.log(
          `Fiserv webhook: afiliado Bonda creado user=${userId} microsite=${microsite.slug} code=${res.data.code}`,
        );
      }
    } catch (err) {
      this.logger.error(
        `Fiserv webhook: error al crear afiliado Bonda user=${userId} org=${organizacionId}`,
        err,
      );
    }
  }

  private generateAffiliateCode(email: string): string {
    const part = email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 5);
    const ts = Date.now().toString(36).slice(-5);
    const r = Math.random().toString(36).slice(2, 5);
    return `${part}_${ts}${r}`;
  }
}
