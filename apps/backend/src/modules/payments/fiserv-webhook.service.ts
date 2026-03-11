import { Injectable, Logger } from '@nestjs/common';
import { validateNotificationHash, validateResponseHash } from './fiserv-connect/utils/connect-hash.util';
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
  ) { }

  /**
   * Procesa la notificación de pago de Fiserv.
   * Valida el hash, actualiza payment_attempt, crea donación y afiliado Bonda si corresponde.
   */
  async handleNotification(body: FiservNotificationBody): Promise<void> {
    const str = (v: string | string[] | undefined) =>
      Array.isArray(v) ? (v[0] ?? '') : (v ?? '');

    const config = this.fiservConnect.getConfig();
    if (!config) {
      this.logger.warn('Fiserv notification: config no disponible');
      return;
    }

    const oid = str(body.oid) || str(body.merchantTransactionId);
    // ¡CRÍTICO! chargetotal DEBE tomarse exacto (ej. "5000,00" con coma si así viene)
    const chargetotal = str(body.chargetotal);
    const currency = str(body.currency);
    const txndatetime = str(body.txndatetime);
    const attempt = await this.supabase.getPaymentAttemptByOrderId(oid);
    if (!attempt) {
      this.logger.warn(
        `Fiserv notification: payment_attempt no encontrado oid=${oid}`,
      );
      return;
    }

    // ¡CRÍTICO! Fiserv omite el storename en el webhook. Usamos el store_id guardado en base de datos.
    const storename = str(body.storename) || attempt.store_id || config.storeId;
    const approvalCode = str(body.approval_code);
    const notificationHash = str(body.response_hash) || str(body.hash) || str(body.notification_hash);
    const ipgTransactionId = str(body.ipgTransactionId);

    // Sin approval_code o sin oid: no es un éxito o no podemos vincular el pago
    if (!approvalCode || !oid) {
      this.logger.warn(
        'Fiserv notification: sin approval_code u oid, se ignora',
      );
      return;
    }

    if (!notificationHash) {
      this.logger.warn('Fiserv notification: sin response_hash o notification_hash en el body');
      return;
    }

    this.logger.debug('Webhook Payload:', body);
    this.logger.debug('Valores extraídos para validación:', {
      chargetotal, currency, txndatetime, storename, approvalCode, notificationHash
    });

    // Fiserv devuelve el chargetotal con comas en vez de puntos a veces (ej. "5000,00"), validemos con el formato sin adaptar para el hash.
    // Usamos validateResponseHash ya que Fiserv envía response_hash en webhook también
    const hashValid = validateNotificationHash(
      chargetotal,
      currency,
      txndatetime,
      storename,
      approvalCode,
      notificationHash,
      config.sharedSecret,
    );

    // Fallback: Si no pasa con Notification Hash, prueba con formato Response Hash
    const hashValidFallback = validateResponseHash(
      approvalCode,
      chargetotal,
      currency,
      txndatetime,
      storename,
      notificationHash,
      config.sharedSecret,
    );

    if (!hashValid && !hashValidFallback) {
      this.logger.warn('Fiserv notification: hash inválido (ni como fallback). Store utilizado: ' + storename);
      throw new Error('Hash de notificación inválido');
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

    // Bonda requiere que el 'code' coincida con su configuración de acceso (ej: 'Número de DNI').
    // Si la ONG exige DNI, el code DEBE ser numerico puro, de lo contrario da error de DNI.
    const code = user.dni ? String(user.dni) : this.generateAffiliateCode(user.email);

    try {
      const res = await this.bonda.crearAfiliado(
        {
          code,
          email: user.email,
          nombre: user.nombre ?? undefined,
          telefono: user.telefono ?? undefined,
          provincia: user.provincia ?? undefined,
          localidad: user.localidad ?? undefined,
          // Bonda requiere DNI numérico. Usamos el DNI del usuario registrado en base de datos.
          dni: user.dni ? Number(user.dni) : undefined,
        },
        { organizacionId },
      );

      if (res?.success && res?.data?.member?.code) {
        await this.supabase.upsertAffiliateForUser(
          userId,
          microsite.id,
          res.data.member.code,
        );
        this.logger.log(
          `Fiserv webhook: afiliado Bonda creado user=${userId} microsite=${microsite.slug} code=${res.data.member.code}`,
        );
      } else if (
        res?.error?.code === 'HttpPublicResponseException' &&
        res?.error?.detail?.code?.[0]?.includes('ya lo está utilizando')
      ) {
        // Bonda rechazó la creación porque el afiliado (DNI/code) ya existe.
        // Esto es un falso error para nosotros, simplemente lo vinculamos en nuestra BD.
        this.logger.log(
          `Fiserv webhook: afiliado Bonda ya existía en Bonda org=${organizacionId}. Vinculando user=${userId} code=${code}`,
        );
        await this.supabase.upsertAffiliateForUser(userId, microsite.id, code);
      } else {
        this.logger.error(`Fiserv webhook: Bonda retornó success: false al crear afiliado`, res);
      }
    } catch (err: any) {
      if (
        err?.response?.data?.error?.code === 'HttpPublicResponseException' &&
        err?.response?.data?.error?.detail?.code?.[0]?.includes('ya lo está utilizando')
      ) {
        this.logger.log(
          `Fiserv webhook: afiliado Bonda ya existía en Bonda org=${organizacionId}. Vinculando user=${userId} code=${code}`,
        );
        await this.supabase.upsertAffiliateForUser(userId, microsite.id, code);
      } else {
        this.logger.error(
          `Fiserv webhook: excepción al crear afiliado Bonda user=${userId} org=${organizacionId}`,
          err,
        );
      }
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
