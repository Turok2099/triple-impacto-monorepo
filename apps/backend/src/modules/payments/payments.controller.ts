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

    if (body.organizacion_id) {
      const org = await this.supabase.getOrganizacionById(body.organizacion_id);
      if (
        org?.monto_minimo != null &&
        Number(body.amount) < Number(org.monto_minimo)
      ) {
        throw new BadRequestException(
          `El monto mínimo para esta organización es ${org.monto_minimo}`,
        );
      }
    }

    await this.supabase.createPaymentAttempt({
      user_id: userId,
      order_id: orderId,
      store_id: config.storeId,
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
}
