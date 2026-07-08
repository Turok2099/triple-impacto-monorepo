import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import axios from 'axios';
import { computeCRC16 } from '../fiserv-connect/utils/crc16.util';

@Injectable()
export class FiservQrService {
  private readonly logger = new Logger(FiservQrService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Formatea un campo EMVCo: [ID][Longitud (2 dígitos)][Valor]
   */
  private formatField(id: string, value: string): string {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  }

  /**
   * Genera el string del código QR dinámico conforme a la especificación EMVCo de Fiserv.
   * @param amount Monto a cobrar.
   * @param orderId ID de la orden o transacción.
   * @param merchantName Nombre del comercio (máximo 25 caracteres, sin acentos).
   */
  generateDynamicQr(amount: number, orderId: string, merchantName?: string): string {
    const config = {
      subcode: this.configService.get<string>('fiserv.qrServiceSubcode'),
      cuit: this.configService.get<string>('fiserv.qrCommerceCuit'),
      mcc: this.configService.get<string>('fiserv.qrMcc'),
      city: this.configService.get<string>('fiserv.qrCity'),
      postalCode: this.configService.get<string>('fiserv.qrPostalCode'),
      domain: this.configService.get<string>('fiserv.qrDomain'),
    };

    // 1. Campos Básicos Obligatorios
    const f00 = this.formatField('00', '01'); // ID Root
    const f01 = this.formatField('01', '12'); // Dynamic QR identifier

    // 2. Campo 40 (Merchant Account Information)
    const f40_00 = this.formatField('00', 'com.yacare'); // Dominio obligatorio yacaré
    const f40_01 = this.formatField('01', config.subcode || 'Y1234567'); // Subcódigo de servicio
    const f40_98 = this.formatField('98', '30692264785'); // CUIT Administrador obligatorio
    const f40_99 = this.formatField('99', '01'); // Resolve API
    const f40Val = `${f40_00}${f40_01}${f40_98}${f40_99}`;
    const f40 = this.formatField('40', f40Val);

    // 3. Campo 50 (CUIT Comercio)
    const f50_00 = this.formatField('00', config.cuit || '30692264785');
    const f50 = this.formatField('50', f50_00);

    // 4. Campos de Transacción
    const f52 = this.formatField('52', config.mcc || '7399'); // MCC (Rubro)
    const f53 = this.formatField('53', '032'); // Moneda: ARS (Peso Argentino)
    
    // El monto debe tener obligatoriamente dos decimales delimitados por punto
    const amountStr = amount.toFixed(2);
    const f54 = this.formatField('54', amountStr); // Monto del QR
    const f58 = this.formatField('58', 'AR'); // Código País

    // 5. Datos de Identificación del Comercio
    // Sanitizar nombre: quitar acentos y caracteres especiales (máx 25 chars)
    const rawName = merchantName || 'AYNI';
    const cleanName = rawName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[^a-zA-Z0-9\s]/g, '') // Quitar especiales
      .substring(0, 25)
      .trim();
    const f59 = this.formatField('59', cleanName);

    const f60 = this.formatField('60', (config.city || 'Buenos Aires').substring(0, 15));
    const f61 = this.formatField('61', (config.postalCode || 'C1000AAB').substring(0, 8));

    // 6. Campo 62: Campo adicional transparente para enviar el order_id
    // Subcampo 01 es de valor libre
    const f62_01 = this.formatField('01', orderId.substring(0, 25));
    const f62 = this.formatField('62', f62_01);

    // 7. Campo 80: Vencimiento del QR (7 días)
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 7);
    const day = expDate.getDate().toString().padStart(2, '0');
    const month = (expDate.getMonth() + 1).toString().padStart(2, '0');
    const year = expDate.getFullYear().toString();
    const expDateStr = `${day}${month}${year}`; // Formato DDMMAAAA

    const f80_00 = this.formatField('00', config.domain || 'ar.com.ayni');
    const f80_01 = this.formatField('01', expDateStr);
    const f80 = this.formatField('80', `${f80_00}${f80_01}`);

    // 8. Campo 82: Dominio inverso + libre
    const f82_00 = this.formatField('00', config.domain || 'ar.com.ayni');
    const f82_01 = this.formatField('01', 'Y301');
    const f82 = this.formatField('82', `${f82_00}${f82_01}`);

    // 9. Construir la cadena sin el CRC
    const qrWithoutCRC = `${f00}${f01}${f40}${f50}${f52}${f53}${f54}${f58}${f59}${f60}${f61}${f62}${f80}${f82}6304`;

    // 10. Calcular y concatenar el CRC
    const crc = computeCRC16(qrWithoutCRC);
    const finalQr = `${qrWithoutCRC.slice(0, -4)}${this.formatField('63', crc)}`;

    this.logger.log(`Generado QR EMVCo para OrderId=${orderId}, Monto=${amountStr}`);
    this.logger.debug(`QR String: ${finalQr}`);

    return finalQr;
  }

  /**
   * Genera una imagen Base64 (Data URI) del código QR a partir de su cadena EMVCo.
   */
  async generateQrImage(qrString: string): Promise<string> {
    try {
      const dataUri = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'M',
        margin: 4,
        width: 300,
      });
      return dataUri;
    } catch (error) {
      this.logger.error('Error al generar la imagen del QR:', error);
      throw error;
    }
  }

  /**
   * Extrae el order_id (subcampo 01 del campo 62) de una cadena EMVCo QR.
   */
  extractOrderIdFromQr(qrString: string): string | null {
    try {
      let index = 0;
      while (index < qrString.length) {
        const id = qrString.substring(index, index + 2);
        const lenStr = qrString.substring(index + 2, index + 4);
        const len = parseInt(lenStr, 10);
        if (isNaN(len)) break;

        const val = qrString.substring(index + 4, index + 4 + len);
        if (id === '62') {
          let subIndex = 0;
          while (subIndex < val.length) {
            const subId = val.substring(subIndex, subIndex + 2);
            const subLenStr = val.substring(subIndex + 2, subIndex + 4);
            const subLen = parseInt(subLenStr, 10);
            if (isNaN(subLen)) break;

            const subVal = val.substring(subIndex + 4, subIndex + 4 + subLen);
            if (subId === '01') {
              return subVal;
            }
            subIndex += 4 + subLen;
          }
        }
        index += 4 + len;
      }
    } catch (e) {
      this.logger.error('Error al parsear el string EMVCo para extraer order_id:', e);
    }
    return null;
  }

  /**
   * Consulta el estado de un pago QR a partir de su UUID.
   */
  async getPaymentStatus(uuid: string): Promise<any> {
    const apiKey = this.configService.get<string>('fiserv.apiKey') || process.env.FISERV_API_KEY;
    const isProd = this.configService.get<string>('environment') === 'production';
    
    if (!apiKey) {
      throw new Error('Fiserv API Key not configured');
    }

    const host = isProd 
      ? 'https://connect.latam.fiservapis.com' 
      : 'https://connect-cert.latam.fiservapis.com';
      
    const url = `${host}/qr-latam-api/v1/operations-managment/payments?uuid=${uuid}`;

    try {
      const response = await axios.get(url, {
        headers: {
          'Authorization': apiKey,
          'Accept': 'application/json',
        }
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(`Error querying Fiserv QR payment status for uuid=${uuid}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  }
}
