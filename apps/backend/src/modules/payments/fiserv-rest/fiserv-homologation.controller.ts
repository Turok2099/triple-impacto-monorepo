import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { FiservRestService } from './fiserv-rest.service';
import { v4 as uuidv4 } from 'uuid';

@Controller('test/fiserv-rest/homologation')
export class FiservHomologationController {
  constructor(private readonly fiservRestService: FiservRestService) { }

  @Post('run-matrix')
  async runMatrix(@Body() data: any) {
    const { cardNumber, expiryMonth, expiryYear, securityCode, cardholderName, cardType } = data;

    if (!cardNumber || !expiryMonth || !expiryYear || !securityCode || !cardType) {
      throw new BadRequestException('Faltan datos de la tarjeta o el tipo de prueba');
    }

    // Usaremos el store principal configurado globalmente (ej. Concentrador)
    // o uno que le pasemos explícitamente. Asumimos el Concentrador por defecto si está en el env, o el genérico.
    const storeId = process.env.FISERV_STORE_MAIN || '5927306113254';

    const results: any[] = [];
    let tokenValue = '';

    try {
      // --- PASO 1: TOKENIZAR LA TARJETA ---
      const tokenPayload = {
        requestType: 'PaymentCardPaymentTokenizationRequest',
        storeId,
        paymentCard: {
          number: cardNumber,
          securityCode,
          expiryDate: { month: expiryMonth, year: expiryYear },
          cardholderName: cardholderName || 'Test Fiserv',
        },
        createToken: { reusable: true }
      };

      const tokenResult = await this.fiservRestService.makeRequest('POST', '/payment-tokens', tokenPayload);
      tokenValue = tokenResult.paymentToken?.value || tokenResult.ipgTransactionId;
      results.push({ step: '1. Tokenization', status: 'SUCCESS', data: tokenResult });

      if (cardType === 'mastercard') {
        // --- MATRIZ MASTERCARD ---
        // 2. SALE con Token + Data Only
        const saleOrderId = `MC-SALE-${uuidv4().substring(0, 6)}`;
        let saleResult: any;
        try {
          const salePayload = {
            requestType: 'PaymentTokenSaleTransaction',
            storeId,
            transactionAmount: { total: '1500.00', currency: 'ARS' },
            paymentMethod: { paymentToken: { value: tokenValue } },
            order: { orderId: saleOrderId },
            authenticationRequest: {
              authenticationType: 'Secure3DAuthenticationRequest',
              methodNotificationURL: 'https://tripleimpacto.site',
              termURL: 'https://tripleimpacto.site'
            }
          };
          saleResult = await this.fiservRestService.makeRequest('POST', '/payments', salePayload);
          results.push({ step: '2. SALE + Data Only', status: 'SUCCESS', data: saleResult, orderId: saleOrderId });
        } catch (e: any) {
          results.push({ step: '2. SALE + Data Only', status: 'ERROR', error: e.response?.data || e.message });
          return { success: false, partialResults: results, error: 'Fallo en SALE' };
        }

        // 3. VOID del SALE
        if (saleResult?.ipgTransactionId) {
          try {
            const voidPayload = { requestType: 'VoidTransaction', storeId };
            const voidResult = await this.fiservRestService.makeRequest('POST', `/payments/${saleResult.ipgTransactionId}`, voidPayload);
            results.push({ step: '3. VOID', status: 'SUCCESS', data: voidResult });
          } catch (e: any) {
            results.push({ step: '3. VOID', status: 'ERROR', error: e.response?.data || e.message });
            // Continuamos aunque falle el void para no perder los datos
          }
        }

      } else if (cardType === 'visa') {
        // --- MATRIZ VISA ---
        // 2. PreAuth con Token (3 Cuotas)
        const preAuthOrderId = `VISA-PRE-${uuidv4().substring(0, 6)}`;
        let preAuthResult: any;
        try {
          const preAuthPayload = {
            requestType: 'PaymentTokenPreAuthTransaction',
            storeId,
            transactionAmount: { total: '100.00', currency: 'ARS' },
            paymentMethod: { paymentToken: { value: tokenValue } },
            order: { orderId: preAuthOrderId, installmentOptions: { numberOfInstallments: 3 } }
          };
          preAuthResult = await this.fiservRestService.makeRequest('POST', '/payments', preAuthPayload);
          results.push({ step: '2. PreAuth (Cuotas)', status: 'SUCCESS', data: preAuthResult, orderId: preAuthOrderId });
        } catch (e: any) {
          results.push({ step: '2. PreAuth (Cuotas)', status: 'ERROR', error: e.response?.data || e.message });
          return { success: false, partialResults: results, error: 'Fallo en PreAuth' };
        }

        // 3. PostAuth (Captura)
        let postAuthResult: any;
        if (preAuthResult?.ipgTransactionId) {
          try {
            const postAuthOrderId = `VISA-POST-${uuidv4().substring(0, 6)}`;
            const postAuthPayload = {
              requestType: 'PostAuthTransaction',
              storeId,
              transactionAmount: { total: '100.00', currency: 'ARS' },
              order: { orderId: preAuthOrderId }
            };
            postAuthResult = await this.fiservRestService.makeRequest('POST', `/payments/${preAuthResult.ipgTransactionId}`, postAuthPayload);
            results.push({ step: '3. PostAuth', status: 'SUCCESS', data: postAuthResult, orderId: preAuthOrderId });
          } catch (e: any) {
            results.push({ step: '3. PostAuth', status: 'ERROR', error: e.response?.data || e.message });
          }
        }

        // 4. Return (Devolución) de la captura
        if (postAuthResult?.ipgTransactionId) {
          try {
            const returnPayload = {
              requestType: 'ReturnTransaction',
              storeId,
              transactionAmount: { total: '10.00', currency: 'ARS' }
            };
            const returnResult = await this.fiservRestService.makeRequest('POST', `/payments/${postAuthResult.ipgTransactionId}`, returnPayload);
            results.push({ step: '4. RETURN', status: 'SUCCESS', data: returnResult });
          } catch (e: any) {
            results.push({ step: '4. RETURN', status: 'ERROR', error: e.response?.data || e.message });
          }
        }
      }

      return { success: true, results };
    } catch (error: any) {
      let errorDetail = error.message || String(error);
      if (error.response?.data) {
        try {
          errorDetail = JSON.stringify(error.response.data, null, 2);
        } catch (e) {
          errorDetail = String(error.response.data);
        }
      }

      return {
        success: false,
        error: errorDetail,
        partialResults: results
      };
    }
  }
}
