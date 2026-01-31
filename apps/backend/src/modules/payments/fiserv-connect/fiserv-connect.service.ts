import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createExtendedHash } from './utils/connect-hash.util';
import type {
  ConnectConfig,
  ConnectPaymentParams,
  BuildPaymentParamsInput,
} from './interfaces/connect-params.types';

/**
 * Formato de fecha/hora requerido por Connect: AAAA:MM:DD-HH:mm:ss
 */
function getTxndatetime(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${y}:${m}:${d}-${h}:${min}:${s}`;
}

@Injectable()
export class FiservConnectService implements OnModuleInit {
  private readonly logger = new Logger(FiservConnectService.name);
  private config: ConnectConfig | null = null;

  onModuleInit() {
    const url = process.env.FISERV_CONNECT_URL;
    const storeId = process.env.FISERV_CONNECT_STORE_ID_1;
    const sharedSecret = process.env.FISERV_CONNECT_SHARED_SECRET;

    if (!url || !storeId || !sharedSecret) {
      this.logger.warn(
        'Fiserv Connect: faltan FISERV_CONNECT_URL, FISERV_CONNECT_STORE_ID_1 o FISERV_CONNECT_SHARED_SECRET en .env'
      );
      return;
    }

    this.config = {
      url: url.trim(),
      storeId: storeId.trim(),
      sharedSecret: sharedSecret.replace(/^["']|["']$/g, '').trim(),
      timezone: process.env.FISERV_CONNECT_TIMEZONE || 'America/Buenos_Aires',
    };
    this.logger.log('Fiserv Connect configurado (Store: ' + this.config.storeId + ')');
  }

  /**
   * Devuelve la configuración actual (solo si está completa).
   */
  getConfig(): ConnectConfig | null {
    return this.config;
  }

  /**
   * Arma los parámetros para el formulario POST a Connect e incluye hashExtended.
   * El frontend puede usar este objeto para generar el form y enviar al gateway.
   */
  buildPaymentParams(input: BuildPaymentParamsInput): ConnectPaymentParams | null {
    if (!this.config) {
      this.logger.warn('Fiserv Connect: no configurado, no se pueden generar params.');
      return null;
    }

    const txndatetime = getTxndatetime();
    const chargetotal = String(Number(input.amount).toFixed(2));

    const params: Record<string, string> = {
      txntype: 'sale',
      timezone: this.config.timezone,
      txndatetime,
      hash_algorithm: 'HMACSHA256',
      storename: this.config.storeId,
      chargetotal,
      currency: input.currency,
      responseFailURL: input.responseFailURL,
      responseSuccessURL: input.responseSuccessURL,
    };

    if (input.transactionNotificationURL) {
      params.transactionNotificationURL = input.transactionNotificationURL;
    }
    if (input.oid) {
      params.oid = input.oid.slice(0, 40);
    }
    if (input.merchantTransactionId) {
      params.merchantTransactionId = input.merchantTransactionId.slice(0, 40);
    }

    params.checkoutoption = 'combinedpage';

    const hashExtended = createExtendedHash(params, this.config.sharedSecret, 'sha256');
    params.hashExtended = hashExtended;

    return params as ConnectPaymentParams;
  }

  /**
   * URL del gateway a la que debe enviarse el formulario POST.
   */
  getGatewayUrl(): string | null {
    return this.config?.url ?? null;
  }
}
