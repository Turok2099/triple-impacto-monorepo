/**
 * Calcula el CRC16 para el estándar EMVCo de Fiserv QR (ISO/IEC 13239).
 * El polinomio utilizado es CRC-16/CCITT-FALSE (0x1021), inicializado en 0xFFFF.
 */
export function computeCRC16(value: string): string {
  const data = Buffer.from(value, 'utf-8');
  let crcValue = 0xFFFF;

  for (const b of data) {
    for (let i = 0; i < 8; i++) {
      const bit = ((b >> (7 - i)) & 1) === 1;
      const c15 = ((crcValue >> 15) & 1) === 1;
      crcValue = (crcValue << 1) & 0xFFFF;
      if (c15 !== bit) {
        crcValue ^= 0x1021;
      }
    }
  }

  let hex = crcValue.toString(16).toUpperCase();
  // Rellenar con ceros a la izquierda para garantizar 4 caracteres hexadecimales
  while (hex.length < 4) {
    hex = '0' + hex;
  }
  return hex;
}
