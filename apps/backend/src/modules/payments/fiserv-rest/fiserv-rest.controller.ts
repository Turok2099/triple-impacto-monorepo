import { Controller, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { FiservRestService } from './fiserv-rest.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('test/fiserv-rest')
export class FiservRestController {
  constructor(private readonly fiservRestService: FiservRestService) {}

  /**
   * Endpoint de prueba para procesar el primer pago (FIRST)
   * Captura la tarjeta, paga y tokeniza.
   */
  @UseGuards(JwtAuthGuard)
  @Post('pay-first')
  async payFirst(@Request() req, @Body() paymentData: any) {
    const userId = req.user.id;
    
    // Validaciones básicas
    if (!paymentData.cardNumber || !paymentData.expiryMonth || !paymentData.expiryYear || !paymentData.amount) {
      throw new BadRequestException('Faltan datos mandatorios para el pago');
    }

    try {
      return await this.fiservRestService.processFirstPayment(userId, paymentData);
    } catch (error) {
      return {
        success: false,
        error: error
      };
    }
  }

  /**
   * Endpoint de prueba para pago recurrente (REPEAT)
   */
  @UseGuards(JwtAuthGuard)
  @Post('pay-recurring')
  async payRecurring(@Request() req, @Body() data: { paymentMethodId: string; amount: number; storeId?: string }) {
    const userId = req.user.id;

    if (!data.paymentMethodId || !data.amount) {
      throw new BadRequestException('Faltan datos para el pago recurrente');
    }

    try {
      return await this.fiservRestService.processRecurringPayment(userId, data.paymentMethodId, data.amount, data.storeId);
    } catch (error) {
      return { success: false, error: error };
    }
  }

  /**
   * Endpoint para anular (Void) una transacción
   */
  @UseGuards(JwtAuthGuard)
  @Post('void')
  async voidTransaction(@Body() data: { ipgTransactionId: string; storeId: string }) {
    if (!data.ipgTransactionId || !data.storeId) {
      throw new BadRequestException('Se requiere ipgTransactionId y storeId');
    }
    try {
      return await this.fiservRestService.voidTransaction(data.ipgTransactionId, data.storeId);
    } catch (error) {
      return { success: false, error: error };
    }
  }

  /**
   * Endpoint para devolver (Return) una transacción
   */
  @UseGuards(JwtAuthGuard)
  @Post('return')
  async returnTransaction(@Body() data: { ipgTransactionId: string; storeId: string; amount: number }) {
    if (!data.ipgTransactionId || !data.storeId || !data.amount) {
      throw new BadRequestException('Se requiere ipgTransactionId, storeId y amount');
    }
    try {
      return await this.fiservRestService.returnTransaction(data.ipgTransactionId, data.storeId, data.amount);
    } catch (error) {
      return { success: false, error: error };
    }
  }
}
