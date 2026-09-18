import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const PREFIX = 'enc:v1:';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function deriveKey(rawKey: string): Buffer {
  // Acepta cualquier passphrase y la deriva a 32 bytes válidos para AES-256.
  return createHash('sha256').update(rawKey, 'utf8').digest();
}

export function isEncryptedSecret(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

export function encryptSecret(plainText: string, rawKey: string): string {
  if (!rawKey) {
    throw new Error(
      'FISERV_SECRET_ENCRYPTION_KEY no está configurada; no se puede cifrar el secreto.',
    );
  }
  const key = deriveKey(rawKey);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return (
    PREFIX +
    [iv, authTag, encrypted].map((buf) => buf.toString('base64')).join(':')
  );
}

/**
 * Desencripta un secreto cifrado con encryptSecret(). Si el valor no tiene el
 * prefijo esperado, se asume texto plano legacy (pre-migración) y se devuelve
 * tal cual, para no romper organizaciones aún no migradas.
 */
export function decryptSecret(
  value: string | null | undefined,
  rawKey: string,
): string | null {
  if (!value) return value ?? null;
  if (!isEncryptedSecret(value)) return value;
  if (!rawKey) {
    throw new Error(
      'FISERV_SECRET_ENCRYPTION_KEY no está configurada; no se puede descifrar el secreto.',
    );
  }

  const [ivB64, authTagB64, cipherB64] = value.slice(PREFIX.length).split(':');
  if (!ivB64 || !authTagB64 || !cipherB64) {
    throw new Error('Formato de secreto cifrado inválido.');
  }

  const key = deriveKey(rawKey);
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(cipherB64, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}
