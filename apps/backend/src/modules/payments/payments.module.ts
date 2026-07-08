import { Module } from '@nestjs/common';
import { FiservConnectModule } from './fiserv-connect/fiserv-connect.module';
import { BondaModule } from '../bonda/bonda.module';
import { AuthModule } from '../auth/auth.module';
import { PaymentsController } from './payments.controller';
import { FiservWebhookService } from './fiserv-webhook.service';
import { MailModule } from '../mail/mail.module';
import { FiservRestModule } from './fiserv-rest/fiserv-rest.module';
import { SubscriptionsCronService } from './subscriptions.cron';
import { FiservQrService } from './fiserv-qr/fiserv-qr.service';

@Module({
  imports: [FiservConnectModule, BondaModule, AuthModule, MailModule, FiservRestModule],
  controllers: [PaymentsController],
  providers: [FiservWebhookService, SubscriptionsCronService, FiservQrService],
  exports: [FiservQrService],
})
export class PaymentsModule {}
