import { Injectable, Logger } from '@nestjs/common';
import {
  validateNotificationHash,
  validateResponseHash,
} from './fiserv-connect/utils/connect-hash.util';
import { FiservConnectService } from './fiserv-connect/fiserv-connect.service';
import { SupabaseService } from '../supabase/supabase.service';
import { BondaService } from './../bonda/bonda.service';
import { MailService } from '../mail/mail.service';
import { FiservQrService } from './fiserv-qr/fiserv-qr.service';

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
    private readonly mailService: MailService,
    private readonly fiservQrService: FiservQrService,
  ) {}

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
    const notificationHash =
      str(body.response_hash) || str(body.hash) || str(body.notification_hash);
    const ipgTransactionId = str(body.ipgTransactionId);

    // Sin approval_code o sin oid: no es un éxito o no podemos vincular el pago
    if (!approvalCode || !oid) {
      this.logger.warn(
        'Fiserv notification: sin approval_code u oid, se ignora',
      );
      return;
    }

    const statusStr = str(body.status);
    
    // Si la transacción fue declinada o cancelada, el approval_code empieza con N o ?, o el status es FAILED/DECLINED
    const isApproved = approvalCode.startsWith('Y') || statusStr === 'APPROVED';
    
    if (!isApproved) {
      this.logger.warn(`Fiserv notification: pago declinado o cancelado (approvalCode=${approvalCode}, status=${statusStr}).`);
      const failReason = str(body.fail_reason) || str(body.failReason) || approvalCode;
      await this.handleDeclined(oid, failReason);
      return;
    }

    if (!notificationHash) {
      this.logger.warn(
        'Fiserv notification: sin response_hash o notification_hash en el body',
      );
      return;
    }

    this.logger.debug('Webhook Payload:', body);
    this.logger.debug('Valores extraídos para validación:', {
      chargetotal,
      currency,
      txndatetime,
      storename,
      approvalCode,
      notificationHash,
    });

    // ESTRATEGIA PRODUCTIVO FISERV: Fetch shared_secret dinámico
    let sharedSecret = config.sharedSecret;
    if (attempt.organizacion_id) {
      const org = await this.supabase.getOrganizacionById(attempt.organizacion_id);
      if (org && org.fiserv_shared_secret) {
        sharedSecret = org.fiserv_shared_secret as string;
      }
    }

    // Fiserv devuelve el chargetotal con comas en vez de puntos a veces (ej. "5000,00"), validemos con el formato sin adaptar para el hash.
    // Usamos validateResponseHash ya que Fiserv envía response_hash en webhook también
    const hashValid = validateNotificationHash(
      chargetotal,
      currency,
      txndatetime,
      storename,
      approvalCode,
      notificationHash,
      sharedSecret,
    );

    // Fallback: Si no pasa con Notification Hash, prueba con formato Response Hash
    const hashValidFallback = validateResponseHash(
      approvalCode,
      chargetotal,
      currency,
      txndatetime,
      storename,
      notificationHash,
      sharedSecret,
    );

    if (!hashValid && !hashValidFallback) {
      this.logger.warn(
        'Fiserv notification: hash inválido (ni como fallback). Store utilizado: ' +
          storename,
      );
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

    // ESTRATEGIA PRODUCTIVO FISERV: Bonda Activado
    if (attempt.organizacion_id) {
      await this.ensureBondaAffiliateForUserAndOrganisation(
        attempt.user_id,
        attempt.organizacion_id,
      );
    }

    // Obtener info del usuario para enviar el correo
    const user = await this.supabase.findUserById(attempt.user_id);
    if (user && user.email) {
      this.mailService.sendPaymentReceiptEmail(user.email, user.nombre || 'Donante', {
        status: 'approved',
        amount: chargetotal || String(attempt.amount),
        currency: currency || attempt.currency || 'ARS',
        approvalCode: approvalCode,
        oid: oid,
      }).catch(err => {
        this.logger.error(`Error enviando correo de éxito para oid=${oid}:`, err);
      });
    }

    this.logger.log(
      `Fiserv notification: pago completado user=${attempt.user_id} oid=${oid}`,
    );
  }

  /**
   * Maneja el flujo de pagos declinados desde la redirección del frontend (o webhook si Fiserv lo envía).
   * Marca el intento de pago como fallido y envía un correo informando el rechazo.
   */
  async handleDeclined(oid: string, failReason?: string, responseCode?: string): Promise<void> {
    if (!oid) return;

    const attempt = await this.supabase.getPaymentAttemptByOrderId(oid);
    if (!attempt) {
      this.logger.warn(`Fiserv declined: attempt no encontrado para oid=${oid}`);
      return;
    }

    // Si ya está completado (ej: webhook llegó antes y fue éxito), no hacer nada
    if (attempt.status === 'completed') {
      this.logger.log(`Fiserv declined: ignorado porque la orden ${oid} ya está completada.`);
      return;
    }

    // Marcar como failed si no lo estaba
    if (attempt.status !== 'failed') {
      await this.supabase.updatePaymentAttempt(attempt.id, { status: 'failed' });
    }

    this.logger.log(`Fiserv order ${oid} marcada como failed.`);

    // Obtener información del usuario
    const user = await this.supabase.findUserById(attempt.user_id);
    if (!user || !user.email) {
      this.logger.warn(`Fiserv declined: usuario o correo no encontrado para el intento de pago ${attempt.id}`);
      return;
    }

    try {
      // Intentar enviar el correo con el QR dinámico de fallback
      const orgName = attempt.organizacion_id
        ? (await this.getOrganizacionNombre(attempt.organizacion_id)) || 'AYNI'
        : 'AYNI';

      const amountNum = parseFloat(attempt.amount) || 0;
      if (amountNum <= 0) {
        throw new Error('Monto inválido para generación de QR');
      }

      // 1. Generar la cadena EMVCo
      const qrString = this.fiservQrService.generateDynamicQr(amountNum, oid, orgName);

      // 2. Generar el código QR en Base64
      const qrImageBase64 = await this.fiservQrService.generateQrImage(qrString);

      // 3. Enviar el correo de fallback
      await this.mailService.sendPaymentFallbackQrEmail(
        user.email,
        user.nombre || 'Donante',
        {
          amount: String(amountNum),
          currency: attempt.currency || 'ARS',
          oid: oid,
          orgName: orgName,
        },
        qrImageBase64,
      );
      this.logger.log(`✅ Correo de fallback QR enviado exitosamente para oid=${oid}`);
    } catch (qrError) {
      this.logger.error(`Error al generar o enviar QR de fallback para oid=${oid}. Enviando correo de rechazo estándar.`, qrError);
      
      // Fallback: Si falla la generación del QR, enviar el correo de rechazo estándar
      this.mailService.sendPaymentReceiptEmail(user.email, user.nombre || 'Donante', {
        status: 'declined',
        oid: oid,
        failReason: failReason || responseCode || 'Rechazado por el procesador de pagos',
      }).catch(err => {
        this.logger.error(`Error enviando correo de rechazo estándar para oid=${oid}:`, err);
      });
    }
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
  public async ensureBondaAffiliateForUserAndOrganisation(
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
    if (existing && existing.is_active === true) {
      return;
    }

    const user = await this.supabase.findUserById(userId);
    if (!user) {
      this.logger.warn(`Fiserv webhook: usuario no encontrado id=${userId}`);
      return;
    }

    // Bonda requiere DNI numérico puro. Limpiamos cualquier punto, espacio o guion.
    let safeDni: number | undefined = undefined;
    if (user.dni) {
      const sanitized = String(user.dni).replace(/\D/g, '');
      if (sanitized.length > 0) {
        safeDni = Number(sanitized);
      }
    }

    const initialCode = safeDni
      ? String(safeDni)
      : this.generateAffiliateCode(user.email);

    let activeEmail = user.email;
    let activeCode = initialCode;
    let activeDni = safeDni;

    const attemptCreation = async (codeToTry: string, emailToTry: string, dniToTry?: number) => {
      return this.bonda.crearAfiliado(
        {
          code: codeToTry,
          email: emailToTry,
          nombre: user.nombre ?? undefined,
          telefono: user.telefono ?? undefined,
          provincia: user.provincia ?? undefined,
          localidad: user.localidad ?? undefined,
          dni: dniToTry,
        },
        { organizacionId },
      );
    };

    try {
      let res = await attemptCreation(activeCode, activeEmail, activeDni);

      // Fallback 1: Email duplicado en Bonda
      if (
        res?.success === false && 
        res?.error?.detail?.email?.[0]?.includes('único')
      ) {
        activeEmail = user.email.replace('@', `+bonda${Date.now()}@`);
        this.logger.warn(`Email ${user.email} en uso en Bonda. Reintentando con ${activeEmail}`);
        res = await attemptCreation(activeCode, activeEmail, activeDni);
      }

      // Fallback 2: Código o DNI duplicado en Bonda (El usuario ya existe en esta ONG)
      const isCodeDuplicated = 
        res?.error?.detail?.code?.[0]?.includes('ya lo está utilizando') || 
        res?.error?.detail?.code?.[0]?.includes('uso') ||
        res?.error?.detail?.code?.[0]?.includes('único') ||
        (res?.error?.code === 'HttpPublicResponseException' && res?.error?.detail?.code?.[0]?.includes('ya lo está utilizando'));

      const isDniDuplicated = 
        res?.error?.detail?.dni?.[0]?.includes('ya lo está utilizando') || 
        res?.error?.detail?.dni?.[0]?.includes('uso') ||
        res?.error?.detail?.dni?.[0]?.includes('único');

      if (res?.success === false && (isCodeDuplicated || isDniDuplicated)) {
        this.logger.warn(`DNI o Código ${activeCode} ya en uso en Bonda. Se asume que el usuario ya estaba registrado y se procede a habilitarlo en nuestra base.`);
        
        try {
          this.logger.log(
            `Fiserv webhook: DNI o Código ${activeCode} ya en uso en Bonda. Actualizando perfil de afiliado con nuevos datos...`,
          );
          await this.bonda.actualizarAfiliado(
            activeCode,
            {
              nombre: user.nombre ?? undefined,
              email: activeEmail,
              telefono: user.telefono ?? undefined,
              provincia: user.provincia ?? undefined,
              localidad: user.localidad ?? undefined,
            },
            { organizacionId },
          );
          this.logger.log(
            `Fiserv webhook: Datos de afiliado ${activeCode} actualizados correctamente en Bonda.`,
          );
        } catch (updateErr: any) {
          this.logger.error(
            `Fiserv webhook: Error al intentar actualizar afiliado duplicado ${activeCode} en Bonda: ${updateErr.message}`,
          );
        }

        // En lugar de crear un usuario fantasma con sufijo, lo consideramos un éxito usando el código original
        res = {
          success: true,
          data: {
            member: {
              code: activeCode
            }
          }
        };
      }

      if (res?.success && res?.data?.member?.code) {
        await this.supabase.upsertAffiliateForUser(
          userId,
          microsite.id,
          res.data.member.code,
        );
        this.logger.log(
          `Fiserv webhook: afiliado Bonda creado exitosamente user=${userId} microsite=${microsite.slug} code=${res.data.member.code}`,
        );
      } else {
        this.logger.error(
          `Fiserv webhook: Bonda retornó success: false al crear afiliado luego de todos los fallbacks`,
          res,
        );
      }
    } catch (err: any) {
      this.logger.error(
        `Fiserv webhook: excepción no controlada al crear afiliado Bonda user=${userId} org=${organizacionId}`,
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
