import { Module } from '@nestjs/common';
import { FiservConnectModule } from './fiserv-connect/fiserv-connect.module';
import { BondaModule } from '../bonda/bonda.module';
import { AuthModule } from '../auth/auth.module';
import { PaymentsController } from './payments.controller';
import { FiservWebhookService } from './fiserv-webhook.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [FiservConnectModule, BondaModule, AuthModule, MailModule],
  controllers: [PaymentsController],
  providers: [FiservWebhookService],
})
export class PaymentsModule {}
