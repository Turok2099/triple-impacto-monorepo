import { Module } from '@nestjs/common';
import { FiservConnectService } from './fiserv-connect.service';

/**
 * Módulo Fiserv Connect (Checkout Connect).
 * Integración con el gateway de pago alojado de Fiserv.
 */
@Module({
  providers: [FiservConnectService],
  exports: [FiservConnectService],
})
export class FiservConnectModule {}
