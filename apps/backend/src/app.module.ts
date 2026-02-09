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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
