import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createExtendedHash } from './utils/connect-hash.util';
import type {
  ConnectConfig,
  ConnectPaymentParams,
  BuildPaymentParamsInput,
} from './interfaces/connect-params.types';

/**
 * Formato de fecha/hora requerido por Connect: AAAA:MM:DD-HH:mm:ss
 * Usa explícitamente la zona horaria de Buenos Aires (America/Buenos_Aires, UTC-3)
 */
function getTxndatetime(): string {
  // Obtener la hora actual en la zona horaria de Buenos Aires
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value || '00';

  const y = get('year');
  const m = get('month');
  const d = get('day');
  const h = get('hour');
  const min = get('minute');
  const s = get('second');

  return `${y}:${m}:${d}-${h}:${min}:${s}`;
}

/**
 * Convierte código de moneda alfabético a código numérico ISO 4217
 * Fiserv Connect requiere códigos numéricos, no alfabéticos
 */
function getCurrencyCode(currency: string): string {
  const codes: Record<string, string> = {
    ARS: '032', // Peso argentino
    UYU: '858', // Peso uruguayo
    USD: '840', // Dólar estadounidense
  };
  // Si ya es numérico, retornar tal cual
  if (/^\d+$/.test(currency)) {
    return currency;
  }
  return codes[currency.toUpperCase()] || currency;
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
        'Fiserv Connect: faltan FISERV_CONNECT_URL, FISERV_CONNECT_STORE_ID_1 o FISERV_CONNECT_SHARED_SECRET en .env',
      );
      return;
    }

    this.config = {
      url: url.trim(),
      storeId: storeId.trim(),
      sharedSecret: sharedSecret.replace(/^["']|["']$/g, '').trim(),
      timezone: process.env.FISERV_CONNECT_TIMEZONE || 'America/Buenos_Aires',
    };
    this.logger.log(
      'Fiserv Connect configurado (Store: ' + this.config.storeId + ')',
    );
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
  buildPaymentParams(
    input: BuildPaymentParamsInput,
  ): ConnectPaymentParams | null {
    if (!this.config) {
      this.logger.warn(
        'Fiserv Connect: no configurado, no se pueden generar params.',
      );
      return null;
    }

    const txndatetime = getTxndatetime();
    const chargetotal = String(Number(input.amount).toFixed(2));
    const currency = getCurrencyCode(input.currency); // Convertir a código numérico ISO 4217

    const params: Record<string, string> = {
      txntype: 'sale',
      timezone: this.config.timezone,
      txndatetime,
      hash_algorithm: 'HMACSHA256',
      mode: 'payonly',
      storename: this.config.storeId,
      chargetotal,
      currency,
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

    const hashExtended = createExtendedHash(
      params,
      this.config.sharedSecret,
      'sha256',
    );
    params.hashExtended = hashExtended;

    // Log para debugging
    this.logger.debug('Params Fiserv Connect:', {
      storename: params.storename,
      chargetotal: params.chargetotal,
      currency: params.currency,
      currencyOriginal: input.currency,
      txntype: params.txntype,
      mode: params.mode,
      oid: params.oid,
      txndatetime: params.txndatetime,
      hasHash: !!params.hashExtended,
      sharedSecretLength: this.config.sharedSecret.length,
    });

    return params as ConnectPaymentParams;
  }

  /**
   * URL del gateway a la que debe enviarse el formulario POST.
   */
  getGatewayUrl(): string | null {
    return this.config?.url ?? null;
  }
}
