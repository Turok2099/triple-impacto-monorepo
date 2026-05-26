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

  @Post('return')
  @UseGuards(JwtAuthGuard)
  async returnTransaccion(@Body() body: any) {
    this.logger.log(`Mock RETURN api call para orden: ${JSON.stringify(body)}`);
    return { ok: true, message: 'RETURN procesado vía API REST Backend' };
  }
}
