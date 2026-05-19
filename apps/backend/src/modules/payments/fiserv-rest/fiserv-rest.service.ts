import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class FiservRestService {
  private readonly logger = new Logger(FiservRestService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {}

  /**
   * Genera las cabeceras de autenticación para Fiserv REST
   * @param payload Cuerpo de la petición (JSON string)
   */
  private getHeaders(payload: string) {
    const apiKey = this.configService.get<string>('fiserv.apiKey') || process.env.FISERV_API_KEY;
    const apiSecret = this.configService.get<string>('fiserv.apiSecret') || process.env.FISERV_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error(`Fiserv API credentials (apiKey or apiSecret) are not configured. Verifica que existan en el Backend de Railway.`);
    }

    const clientRequestId = uuidv4();
    const timestamp = Date.now().toString();

    // Algoritmo de firma: HMAC-SHA256(apiKey + clientRequestId + timestamp + payload)
    const message = apiKey + clientRequestId + timestamp + payload;
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(message)
      .digest('base64');

    return {
      'Content-Type': 'application/json',
      'Api-Key': apiKey,
      'Client-Request-Id': clientRequestId,
      'Timestamp': timestamp,
      'Message-Signature': signature,
    };
  }

  /**
   * Ejecuta una petición directa (útil para la matriz de homologación)
   */
  async makeRequest(method: 'POST' | 'GET', path: string, payload: any = null) {
    const baseUrl = this.configService.get<string>('fiserv.baseUrl');
    const url = `${baseUrl}${path}`;
    const payloadString = payload ? JSON.stringify(payload) : '';
    const headers = this.getHeaders(payloadString);

    try {
      const config: any = { method, url, headers };
      if (payload) config.data = payload;
      
      const response = await axios(config);
      return response.data;
    } catch (error: any) {
      this.logger.error(`Error en makeRequest ${path}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  }

  /**
   * Procesa una verificación de tarjeta para obtener un token (Flujo No-PCI)
   */
  async processFirstPayment(userId: string, paymentData: any) {
    const baseUrl = this.configService.get<string>('fiserv.baseUrl');
    const endpoint = `${baseUrl}/payments`;
    const storeId = paymentData.storeId || '5926012006';

    // Construir el payload para verificación de tarjeta (Monto $0)
    // Requerido para comercios No-PCI que quieren tokenizar
    const payload = {
      requestType: 'PaymentCardVerificationTransaction',
      storeId: storeId,
      paymentMethod: {
        paymentCard: {
          number: paymentData.cardNumber,
          securityCode: paymentData.securityCode,
          expiryDate: {
            month: paymentData.expiryMonth,
            year: paymentData.expiryYear,
          },
          cardholderName: paymentData.cardholderName,
        },
      },
      // Habilitar tokenización (Card on File)
      createToken: {
        reusable: true,
      },
      // Inyección para 3DS DataOnly
      ...(paymentData.authenticationRequest ? { authenticationRequest: paymentData.authenticationRequest } : {})
    };

    const payloadString = JSON.stringify(payload);
    const headers = this.getHeaders(payloadString);

    try {
      this.logger.log(`Enviando VERIFICACIÓN (Tokenización) a Fiserv para usuario ${userId} en tienda ${storeId}`);
      const response = await axios.post(endpoint, payload, { headers });
      
      const result = response.data;

      // Si la verificación es aprobada, guardamos el token
      if (result.transactionStatus === 'APPROVED') {
        const tokenValue = result.paymentToken?.value || result.ipgTransactionId;
        
        await this.supabaseService.from('user_payment_methods').insert({
          user_id: userId,
          fiserv_token: tokenValue,
          scheme_transaction_id: result.schemeTransactionId || null,
          card_brand: result.paymentMethodDetails?.paymentCard?.brand,
          last_4: result.paymentMethodDetails?.paymentCard?.last4,
          exp_month: paymentData.expiryMonth,
          exp_year: paymentData.expiryYear,
          cardholder_name: paymentData.cardholderName,
          is_active: true,
        });

        this.logger.log(`✅ Tarjeta verificada y token guardado para usuario ${userId}`);
      }

      return result;
    } catch (error) {
      this.logger.error('Error en verificación de tarjeta Fiserv REST:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  }

  /**
   * Procesa un pago recurrente (REPEAT) usando un token guardado
   */
  async processRecurringPayment(userId: string, paymentMethodId: string, amount: number, storeId: string = '5926012006') {
    // ... codigo anterior resumido (el original del archivo) ...
    const { data: paymentMethod, error } = await this.supabaseService
      .from('user_payment_methods')
      .select('*')
      .eq('id', paymentMethodId)
      .eq('user_id', userId)
      .single();

    if (error || !paymentMethod) {
      throw new Error('Método de pago no encontrado o no pertenece al usuario');
    }

    const baseUrl = this.configService.get<string>('fiserv.baseUrl');
    const endpoint = `${baseUrl}/payments`;
    
    // Payload para REPEAT usando el token
    const payload = {
      requestType: 'PaymentTokenSaleTransaction',
      storeId: storeId,
      transactionAmount: {
        total: amount.toString(),
        currency: 'ARS',
      },
      paymentMethod: {
        paymentToken: {
          value: paymentMethod.fiserv_token,
        },
      },
      order: {
        orderId: `REC-${uuidv4().substring(0, 8)}`,
        installmentOptions: {
          recurringType: 'REPEAT',
        },
      },
      ...(paymentMethod.card_brand?.toUpperCase() === 'VISA' && paymentMethod.scheme_transaction_id ? {
        storedCredentials: {
          sequence: 'SUBSEQUENT',
          scheduled: false,
          referencedSchemeTransactionId: paymentMethod.scheme_transaction_id,
        }
      } : {})
    };

    const payloadString = JSON.stringify(payload);
    const headers = this.getHeaders(payloadString);

    try {
      this.logger.log(`Enviando pago REPEAT a Fiserv para usuario ${userId}`);
      const response = await axios.post(endpoint, payload, { headers });
      return response.data;
    } catch (error) {
      this.logger.error('Error en pago recurrente Fiserv REST:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  }

  /**
   * Anulación de una transacción (Void)
   */
  async voidTransaction(id: string, storeId: string) {
    // Si el ID empieza con ORD-, es un OrderID, de lo contrario es un TransactionID
    const isOrder = id.startsWith('ORD-');
    const path = isOrder ? 'orders' : 'payments';
    const baseUrl = this.configService.get<string>('fiserv.baseUrl');
    const endpoint = `${baseUrl}/${path}/${id}`;
    
    const payload = {
      requestType: 'VoidTransaction',
      storeId: storeId
    };

    const payloadString = JSON.stringify(payload);
    const headers = this.getHeaders(payloadString);

    try {
      this.logger.log(`Anulando ${isOrder ? 'Pedido' : 'Transacción'} ${id} en tienda ${storeId}`);
      const response = await axios.post(endpoint, payload, { headers });
      return response.data;
    } catch (error) {
      this.logger.error(`Error en Void (${path}):`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  }

  /**
   * Devolución de una transacción (Return)
   */
  async returnTransaction(id: string, storeId: string, amount: number) {
    const isOrder = id.startsWith('ORD-');
    const path = isOrder ? 'orders' : 'payments';
    const baseUrl = this.configService.get<string>('fiserv.baseUrl');
    const endpoint = `${baseUrl}/${path}/${id}`;
    
    const payload = {
      requestType: 'ReturnTransaction',
      storeId: storeId,
      transactionAmount: {
        total: amount.toFixed(2), // Forzar 2 decimales para evitar error 10601
        currency: 'ARS'
      }
    };

    const payloadString = JSON.stringify(payload);
    const headers = this.getHeaders(payloadString);

    try {
      this.logger.log(`Devolviendo ${isOrder ? 'Pedido' : 'Transacción'} ${id} en tienda ${storeId} (Monto: ${amount.toFixed(2)})`);
      const response = await axios.post(endpoint, payload, { headers });
      return response.data;
    } catch (error) {
      this.logger.error(`Error en Return (${path}):`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  }
}
