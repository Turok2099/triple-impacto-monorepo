import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { BondaModule } from './modules/bonda/bonda.module';
import { SupabaseModule } from './modules/supabase/supabase.module';
import { AuthModule } from './modules/auth/auth.module';
import { PublicModule } from './modules/public/public.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SyncModule } from './modules/sync/sync.module';
import { AdminModule } from './modules/admin/admin.module';
import { MailModule } from './modules/mail/mail.module';
import { NewsletterModule } from './modules/newsletter/newsletter.module';

@Module({
  imports: [
    ScheduleModule.forRoot(), // Habilitar cron jobs
    ConfigModule,
    SupabaseModule,
    BondaModule,
    AuthModule,
    PublicModule,
    PaymentsModule,
    SyncModule, // Módulo de sincronización
    AdminModule, // Panel de Súper Administrador
    MailModule, // Servicio de Correos (Resend)
    NewsletterModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
