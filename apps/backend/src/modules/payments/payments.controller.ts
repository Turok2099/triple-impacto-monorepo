import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { randomUUID } from 'crypto';
import { FiservWebhookService } from './fiserv-webhook.service';
import { FiservConnectService } from './fiserv-connect/fiserv-connect.service';
import { SupabaseService } from '../supabase/supabase.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CrearTransaccionDto } from './dto/crear-transaccion.dto';
import { FiservRestService } from './fiserv-rest/fiserv-rest.service';
import { BondaService } from '../bonda/bonda.service';
import { FiservQrService } from './fiserv-qr/fiserv-qr.service';
import { MailService } from '../mail/mail.service';

/** Respuesta de crear-transaccion: params para el form POST a Fiserv + URL del gateway */
export interface CrearTransaccionResponseDto {
  gatewayUrl: string;
  formParams: Record<string, string>;
}

/**
 * Endpoint de notificación servidor a servidor de Fiserv Connect.
 * Fiserv envía POST application/x-www-form-urlencoded con los mismos parámetros
 * que la redirección (chargetotal, currency, txndatetime, storename, approval_code,
 * notification_hash, oid, merchantTransactionId, ipgTransactionId, etc.).
 *
 * URL a configurar en transactionNotificationURL al armar el formulario de pago.
 * Ej: https://tu-dominio.com/api/payments/fiserv/notification
 */
@Controller('payments/fiserv')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly fiservWebhook: FiservWebhookService,
    private readonly fiservConnect: FiservConnectService,
    private readonly supabase: SupabaseService,
    private readonly fiservRest: FiservRestService,
    private readonly bondaService: BondaService,
    private readonly fiservQr: FiservQrService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Crear transacción: genera payment_attempt y devuelve params + URL para que el front
   * envíe el form a Fiserv Connect.
   * Requiere JWT. user_id sale del token.
   */
  @Post('crear-transaccion')
  @UseGuards(JwtAuthGuard)
  async crearTransaccion(
    @Body() body: CrearTransaccionDto,
    @Req() req: Request & { user?: { userId: string } },
  ): Promise<CrearTransaccionResponseDto> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('Se requiere autenticación');
    }

    const config = this.fiservConnect.getConfig();
    if (!config) {
      throw new BadRequestException(
        'Fiserv Connect no está configurado (FISERV_CONNECT_URL, STORE_ID, SHARED_SECRET)',
      );
    }

    const gatewayUrl = this.fiservConnect.getGatewayUrl();
    if (!gatewayUrl) {
      throw new BadRequestException(
        'No se pudo obtener la URL del gateway Fiserv',
      );
    }

    const orderId = randomUUID();
    const currency = body.currency ?? 'ARS';
    const notificationURL =
      body.transactionNotificationURL ??
      (process.env.API_BASE_URL
        ? `${process.env.API_BASE_URL.replace(/\/$/, '')}/api/payments/fiserv/notification`
        : undefined);

    if (!notificationURL) {
      throw new BadRequestException(
        'Indica transactionNotificationURL en el body o configura API_BASE_URL en el servidor',
      );
    }

    // ESTRATEGIA PRODUCTIVO FISERV: Proxy según organización dinámico
    let finalStoreId: string;
    let finalSharedSecret: string;
    
    if (body.organizacion_id) {
      const org = await this.supabase.getOrganizacionById(body.organizacion_id);
      if (!org || !org.fiserv_store_id || (org.fiserv_store_id as string).trim() === '') {
        throw new BadRequestException('La organización seleccionada no tiene configuración de pagos habilitada.');
      }
      finalStoreId = org.fiserv_store_id as string;
      finalSharedSecret = org.fiserv_shared_secret as string;
    } else {
      throw new BadRequestException('Se requiere seleccionar una organización.');
    }
    body.storename = finalStoreId;

    // ESTRATEGIA 3DS DATA ONLY POR REQUERIMIENTO CARTA FUNCIONAL FISERV
    if (!body.authenticateTransaction) {
      (body as any).authenticateTransaction = 'true';
      (body as any).threeDSEmvCoMessageCategory = '80';
    }

    // Generar registro inicial de la transacción (Estado 'pendiente')
    await this.supabase.createPaymentAttempt({
      user_id: userId,
      order_id: orderId,
      store_id: finalStoreId,
      amount: body.amount,
      currency,
      organizacion_id: body.organizacion_id,
    });

    const formParams = this.fiservConnect.buildPaymentParams({
      amount: body.amount,
      currency,
      responseSuccessURL: body.responseSuccessURL,
      responseFailURL: body.responseFailURL,
      transactionNotificationURL: notificationURL,
      oid: orderId,
      merchantTransactionId: orderId,
      storename: body.storename,
      sharedSecret: finalSharedSecret,
      txntype: body.txntype,
      numberOfInstallments: body.numberOfInstallments,
      referencedMerchantTransactionId: (body as any)
        .referencedMerchantTransactionId,
      authenticateTransaction: (body as any).authenticateTransaction,
      threeDSEmvCoMessageCategory: (body as any).threeDSEmvCoMessageCategory,
    });

    if (!formParams) {
      throw new BadRequestException(
        'No se pudieron generar los parámetros de pago',
      );
    }

    this.logger.log(
      `Transacción preparada: user=${userId} order_id=${orderId} amount=${body.amount}`,
    );

    return {
      gatewayUrl,
      formParams: formParams as Record<string, string>,
    };
  }

  /**
   * Endpoint de pago REST síncrono.
   * Realiza el cobro de la tarjeta (Sale), tokeniza y en caso de éxito:
   * 1. Registra la donación.
   * 2. Afilia al usuario a Bonda.
   */
  @Post('rest-sale')
  @UseGuards(JwtAuthGuard)
  async restSale(
    @Body() body: any,
    @Req() req: Request & { user?: { userId: string } },
  ) {
    const userId = req.user?.userId;
    if (!userId) throw new BadRequestException('Se requiere autenticación');

    let finalStoreId: string;
    
    if (body.organizacion_id) {
      const org = await this.supabase.getOrganizacionById(body.organizacion_id);
      if (!org || !org.fiserv_store_id || (org.fiserv_store_id as string).trim() === '') {
        throw new BadRequestException('La organización seleccionada no tiene configuración de pagos habilitada.');
      }
      finalStoreId = org.fiserv_store_id as string;
    } else {
      throw new BadRequestException('Se requiere seleccionar una organización.');
    }
    
    // Asignar el store id resuelto al body para que fiservRestService lo use
    body.storeId = finalStoreId;

    const orderId = randomUUID();
    body.orderId = orderId;

    try {
      // Registrar intento de pago (pendiente)
      const attempt = await this.supabase.createPaymentAttempt({
        user_id: userId,
        order_id: orderId,
        store_id: finalStoreId || '5927306113254', // fallback
        amount: body.amount,
        currency: body.currency || 'ARS',
        organizacion_id: body.organizacion_id,
      });

      // Procesar pago en Fiserv REST
      const result = await this.fiservRest.processSalePayment(userId, body);

      if (result.transactionStatus === 'APPROVED') {
        // Actualizar intento de pago a completado
        await this.supabase.updatePaymentAttempt(attempt.id, {
          status: 'completed',
          fiserv_raw_response: result as Record<string, unknown>,
        });

        // Registrar la donación exitosa
        const { data: orgData } = await this.supabase
          .from('organizaciones')
          .select('nombre')
          .eq('id', body.organizacion_id)
          .maybeSingle();

        await this.supabase.createDonacion({
          usuario_id: userId,
          monto: parseFloat(body.amount),
          moneda: body.currency || 'ARS',
          metodo_pago: 'fiserv-rest',
          organizacion_id: body.organizacion_id,
          organizacion_nombre: orgData?.nombre,
          estado: 'completada',
          payment_id: result.ipgTransactionId || undefined,
          payment_status: result.transactionStatus,
        });

        // Afiliar a Bonda si aplica
        if (body.organizacion_id) {
          await this.fiservWebhook.ensureBondaAffiliateForUserAndOrganisation(
            userId,
            body.organizacion_id,
          );
        }

        // Si es pago recurrente, registrar la suscripción
        if (body.isRecurring && result.paymentMethodId) {
          try {
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            const fechaProximoCobro = nextMonth.toISOString().split('T')[0];

            await this.supabase.createSuscripcion({
              usuario_id: userId,
              organizacion_id: body.organizacion_id,
              payment_method_id: result.paymentMethodId,
              monto: parseFloat(body.amount),
              moneda: body.currency || 'ARS',
              frecuencia: 'mensual',
              fecha_proximo_cobro: fechaProximoCobro,
            });
            this.logger.log(`Suscripción creada exitosamente para orden ${orderId}`);
          } catch (subError) {
            this.logger.error('Error al crear suscripción en rest-sale:', subError);
            // No fallamos el pago completo si la suscripción falla, ya cobramos.
          }
        }

        return { success: true, result };
      } else {
        // El pago no fue aprobado (declinado)
        await this.supabase.updatePaymentAttempt(attempt.id, {
          status: 'failed',
          fiserv_raw_response: result as Record<string, unknown>,
        });
        
        throw new BadRequestException(
          result.processor?.responseMessage || result.error?.message || 'Pago rechazado por el procesador'
        );
      }
    } catch (error: any) {
      this.logger.error('Error en rest-sale:', error);
      throw new BadRequestException(error.message || error);
    }
  }

  @Post('notification')
  @HttpCode(HttpStatus.OK)
  async handleFiservNotification(
    @Body() body: Record<string, string | string[] | undefined>,
  ): Promise<{ ok: boolean }> {
    try {
      await this.fiservWebhook.handleNotification(body);
      return { ok: true };
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Error procesando notificación';
      this.logger.warn(`Fiserv notification error: ${msg}`);
      throw new BadRequestException(msg);
    }
  }

  /**
   * Endpoint interno (o que puede ser llamado por frontend confiable)
   * para notificar un pago declinado desde la redirección.
   */
  @Post('notification/declined')
  @HttpCode(HttpStatus.OK)
  async handleFiservDeclined(@Body() body: { oid: string; failReason?: string; responseCode?: string }) {
    if (!body.oid) {
      throw new BadRequestException('Falta oid');
    }
    await this.fiservWebhook.handleDeclined(body.oid, body.failReason, body.responseCode);
    return { ok: true };
  }

  /**
   * Webhook de notificaciones en tiempo real para pagos con QR de Fiserv.
   * Maneja tanto notificaciones estándar como personalizadas.
   */
  @Post('qr')
  @HttpCode(HttpStatus.OK)
  async handleFiservQrNotification(@Body() body: any): Promise<{ ok: boolean }> {
    this.logger.log(`Recibido Webhook QR de Fiserv: ${JSON.stringify(body)}`);

    let uuid = body.id || body.uuid;
    let qrString = body.qr;
    let orderId = body.idTransaccionExterno || body.idc;

    // Si es notificación estándar, el body tiene uuid pero no detalles de la transacción.
    // Consultamos la API oficial de Fiserv para validar y obtener detalles de pago de forma segura.
    if (uuid && (!orderId || !qrString)) {
      try {
        this.logger.log(`Consultando detalles de pago en Fiserv para UUID: ${uuid}`);
        const details = await this.fiservQr.getPaymentStatus(uuid);
        this.logger.debug(`Detalles obtenidos de Fiserv: ${JSON.stringify(details)}`);
        
        qrString = details.qr || qrString;
        orderId = details.idTransaccionExterno || details.idc || orderId;

        // Si obtenemos el QR de la consulta, podemos parsear el order_id
        if (qrString && !orderId) {
          orderId = this.fiservQr.extractOrderIdFromQr(qrString);
        }
      } catch (err) {
        this.logger.error(`Error consultando detalles del pago QR para UUID ${uuid}:`, err);
        throw new BadRequestException('No se pudo validar el pago QR con la API de Fiserv');
      }
    }

    // Si aún no tenemos el orderId pero tenemos el qr en el body
    if (qrString && !orderId) {
      orderId = this.fiservQr.extractOrderIdFromQr(qrString);
    }

    if (!orderId) {
      this.logger.warn('No se pudo determinar el order_id para la notificación QR. Cuerpo recibido:', body);
      throw new BadRequestException('No se pudo identificar el ID de la transacción');
    }

    // Buscar el intento de pago en Supabase.
    // Como el orderId puede estar truncado a 25 caracteres, buscamos por prefijo.
    const { data: attempt, error: attemptError } = await this.supabase
      .getClient()
      .from('payment_attempts')
      .select('*')
      .like('order_id', `${orderId}%`)
      .maybeSingle();

    if (attemptError || !attempt) {
      this.logger.warn(`No se encontró intento de pago para orderId=${orderId}`);
      throw new BadRequestException('Intento de pago no encontrado');
    }

    if (attempt.status === 'completed') {
      this.logger.log(`Intento de pago ${attempt.id} ya completado. Ignorando.`);
      return { ok: true };
    }

    // Actualizar intento de pago a completado
    await this.supabase.updatePaymentAttempt(attempt.id, {
      status: 'completed',
      fiserv_raw_response: body,
    });

    // Registrar la donación exitosa
    const { data: orgData } = await this.supabase
      .from('organizaciones')
      .select('nombre')
      .eq('id', attempt.organizacion_id)
      .maybeSingle();

    const monto = parseFloat(body.montoPagado) || parseFloat(attempt.amount) || 0;

    await this.supabase.createDonacion({
      usuario_id: attempt.user_id,
      monto,
      moneda: attempt.currency || 'ARS',
      metodo_pago: 'fiserv-qr',
      organizacion_id: attempt.organizacion_id || undefined,
      organizacion_nombre: orgData?.nombre || 'AYNI',
      estado: 'completada',
      payment_id: uuid || undefined,
      payment_status: 'APPROVED',
    });

    // Registrar la afiliación a Bonda para el usuario
    if (attempt.organizacion_id) {
      await this.fiservWebhook.ensureBondaAffiliateForUserAndOrganisation(
        attempt.user_id,
        attempt.organizacion_id,
      );
    }

    // Obtener información del usuario para enviar comprobante de éxito
    const user = await this.supabase.findUserById(attempt.user_id);
    if (user && user.email) {
      this.mailService.sendPaymentReceiptEmail(user.email, user.nombre || 'Donante', {
        status: 'approved',
        amount: String(monto),
        currency: attempt.currency || 'ARS',
        approvalCode: 'QR-PAID',
        oid: attempt.order_id, // Usamos el UUID completo original guardado en BD
      }).catch(err => {
        this.logger.error(`Error enviando correo de éxito para orden QR ${attempt.order_id}:`, err);
      });
    }

    this.logger.log(`✅ Pago QR conciliado exitosamente para order_id=${attempt.order_id}`);
    return { ok: true };
  }


  @Post('posauth')
  @UseGuards(JwtAuthGuard)
  async captureTransaccion(@Body() body: any) {
    this.logger.log(
      `Mock POSAUTH api call para orden: ${JSON.stringify(body)}`,
    );
    return { ok: true, message: 'POSAUTH procesado vía API REST Backend' };
  }

  @Post('void')
  @UseGuards(JwtAuthGuard)
  async voidTransaccion(@Body() body: any) {
    this.logger.log(`Mock VOID api call para orden: ${JSON.stringify(body)}`);
    return { ok: true, message: 'VOID procesado vía API REST Backend' };
  }

  @Post('cancelar-suscripcion')
  @UseGuards(JwtAuthGuard)
  async cancelarSuscripcion(
    @Body() body: { organizacionId: string },
    @Req() req: Request & { user?: { userId: string } },
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('Se requiere autenticación');
    }

    if (!body.organizacionId) {
      throw new BadRequestException('Falta organizacionId');
    }

    try {
      // 1. Cancelar suscripción activa local para evitar futuros cobros
      const { data: suscripciones, error: subError } = await this.supabase.getClient()
        .from('suscripciones')
        .update({ estado: 'cancelada' })
        .eq('usuario_id', userId)
        .eq('organizacion_id', body.organizacionId)
        .eq('estado', 'activa')
        .select();

      if (subError) {
        this.logger.error('Error cancelando suscripción local:', subError);
        throw new BadRequestException('No se pudo cancelar la suscripción local');
      }

      // 2. Desactivar afiliación a Bonda (API + Local DB)
      try {
        const bondaMicrosite = await this.supabase.getBondaMicrositeByOrganizacionId(body.organizacionId);
        if (bondaMicrosite) {
          const affiliate = await this.supabase.getAffiliateForUserAndMicrosite(userId, bondaMicrosite.id);
          if (affiliate && affiliate.affiliate_code) {
             // Llama a Bonda para eliminar el afiliado (soft delete por 30 días)
             await this.bondaService.eliminarAfiliado(affiliate.affiliate_code, { organizacionId: body.organizacionId });
             
             // Actualizar DB local
             await this.supabase.getClient().from('usuarios_bonda_afiliados')
               .update({ is_active: false })
               .eq('user_id', userId)
               .eq('bonda_microsite_id', bondaMicrosite.id);
          }
        }
      } catch (bondaError) {
        this.logger.error('Error cancelando afiliación Bonda:', bondaError);
        // Continuamos de todos modos porque la suscripción ya se canceló
      }

      return {
        ok: true,
        message: 'Suscripción y afiliación canceladas exitosamente',
        canceladas: suscripciones?.length || 0
      };
    } catch (err: any) {
      this.logger.error('Error general cancelando suscripción:', err);
      throw new BadRequestException(err.message || 'Error al cancelar la suscripción');
    }
  }

  @Post('return')
  @UseGuards(JwtAuthGuard)
  async returnTransaccion(@Body() body: any) {
    this.logger.log(`Mock RETURN api call para orden: ${JSON.stringify(body)}`);
    return { ok: true, message: 'RETURN procesado vía API REST Backend' };
  }
}
