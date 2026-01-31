/**
 * Parámetros que se envían en el formulario POST a Fiserv Connect.
 * Todos los valores deben ser string (como en un form).
 */
export interface ConnectPaymentParams {
  txntype: string;
  timezone: string;
  txndatetime: string;
  hash_algorithm: string;
  hashExtended: string;
  storename: string;
  chargetotal: string;
  currency: string;
  responseFailURL: string;
  responseSuccessURL: string;
  /** Opcional: notificación servidor a servidor */
  transactionNotificationURL?: string;
  /** Opcional: ID de orden/pedido (máx 40 caracteres) */
  oid?: string;
  /** Opcional: ID de transacción del comercio (máx 40 caracteres) */
  merchantTransactionId?: string;
  /** Opcional: combinedpage para ver formulario en una sola página */
  checkoutoption?: string;
  [key: string]: string | undefined;
}

/**
 * Configuración de Connect leída de variables de entorno.
 */
export interface ConnectConfig {
  url: string;
  storeId: string;
  sharedSecret: string;
  timezone: string;
}

/**
 * Entrada para armar los parámetros de pago Connect.
 */
export interface BuildPaymentParamsInput {
  amount: number;
  currency: string;
  responseSuccessURL: string;
  responseFailURL: string;
  /** URL para notificación servidor a servidor (opcional) */
  transactionNotificationURL?: string;
  /** ID de orden/pedido (opcional) */
  oid?: string;
  /** ID de transacción del comercio (opcional) */
  merchantTransactionId?: string;
}
