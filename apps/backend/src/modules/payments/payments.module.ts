import { Module } from '@nestjs/common';
import { FiservConnectModule } from './fiserv-connect/fiserv-connect.module';
import { BondaModule } from '../bonda/bonda.module';
import { AuthModule } from '../auth/auth.module';
import { PaymentsController } from './payments.controller';
import { FiservWebhookService } from './fiserv-webhook.service';

@Module({
  imports: [FiservConnectModule, BondaModule, AuthModule],
  controllers: [PaymentsController],
  providers: [FiservWebhookService],
})
export class PaymentsModule {}
