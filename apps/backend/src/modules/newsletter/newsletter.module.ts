import { Module } from '@nestjs/common';
import { NewsletterController } from './newsletter.controller';
import { NewsletterService } from './newsletter.service';
import { MailModule } from '../mail/mail.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [MailModule, SupabaseModule],
  controllers: [NewsletterController],
  providers: [NewsletterService],
  exports: [NewsletterService],
})
export class NewsletterModule {}
