import * as crypto from 'crypto';

/**
 * Nombre del parámetro que contiene el hash (no debe formar parte del cálculo).
 */
const HASH_PARAM_NAMES = ['hashExtended', 'hash'];

/**
 * Calcula el hash extendido para Fiserv Connect según el manual (Apéndice I).
 *
 * Reglas:
 * - Se usan todos los parámetros de la solicitud EXCEPTO hashExtended/hash.
 * - Orden ascendente por nombre del parámetro.
 * - Se concatenan solo los VALORES con "|".
 * - HMAC-SHA256 sobre esa cadena usando sharedSecret como clave.
 * - Resultado en Base64.
 *
 * @param params Objeto con los parámetros que se enviarán en el request (sin hashExtended).
 * @param sharedSecret Shared Secret proporcionado por Fiserv.
 * @param algorithm Algoritmo HMAC; Connect soporta HMACSHA256, HMACSHA384, HMACSHA512.
 * @returns Hash en Base64.
 */
export function createExtendedHash(
  params: Record<string, string>,
  sharedSecret: string,
  algorithm: 'sha256' | 'sha384' | 'sha512' = 'sha256'
): string {
  const filtered = { ...params };
  for (const name of HASH_PARAM_NAMES) {
    delete filtered[name];
  }

  const sortedKeys = Object.keys(filtered).sort();
  const stringToHash = sortedKeys.map((k) => filtered[k]).join('|');

  const hmac = crypto.createHmac(`sha${algorithm === 'sha256' ? 256 : algorithm === 'sha384' ? 384 : 512}`, sharedSecret);
  hmac.update(stringToHash);
  return hmac.digest('base64');
}

/**
 * Valida el response_hash que envía Fiserv en la redirección de éxito/error.
 * Cadena esperada: approval_code|chargetotal|currency|txndatetime|storename
 *
 * @param approvalCode Valor de approval_code en la respuesta.
 * @param chargetotal Valor de chargetotal en la respuesta.
 * @param currency Valor de currency en la respuesta.
 * @param txndatetime Valor de txndatetime enviado en la solicitud original (debe guardarse).
 * @param storename Valor de storename.
 * @param responseHash Valor de response_hash recibido.
 * @param sharedSecret Shared Secret.
 * @returns true si el hash es válido.
 */
export function validateResponseHash(
  approvalCode: string,
  chargetotal: string,
  currency: string,
  txndatetime: string,
  storename: string,
  responseHash: string,
  sharedSecret: string
): boolean {
  try {
    const stringToHash = [approvalCode, chargetotal, currency, txndatetime, storename].join('|');
    const expected = crypto.createHmac('sha256', sharedSecret).update(stringToHash).digest('base64');
    const a = Buffer.from(expected, 'base64');
    const b = Buffer.from(responseHash, 'base64');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Valida el notification_hash de la notificación servidor a servidor.
 * Cadena: chargetotal|currency|txndatetime|storename|approval_code
 *
 * @param chargetotal Valor recibido en la notificación.
 * @param currency Valor recibido.
 * @param txndatetime Valor recibido.
 * @param storename Valor recibido.
 * @param approvalCode Valor recibido.
 * @param notificationHash Valor de notification_hash recibido.
 * @param sharedSecret Shared Secret.
 * @returns true si el hash es válido.
 */
export function validateNotificationHash(
  chargetotal: string,
  currency: string,
  txndatetime: string,
  storename: string,
  approvalCode: string,
  notificationHash: string,
  sharedSecret: string
): boolean {
  try {
    const stringToHash = [chargetotal, currency, txndatetime, storename, approvalCode].join('|');
    const expected = crypto.createHmac('sha256', sharedSecret).update(stringToHash).digest('base64');
    const a = Buffer.from(expected, 'base64');
    const b = Buffer.from(notificationHash, 'base64');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
