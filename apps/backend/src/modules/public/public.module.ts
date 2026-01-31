import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PublicController } from './public.controller';
import { SyncCuponesService } from './sync-cupones.service';
import { BondaModule } from '../bonda/bonda.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [
    ScheduleModule.forRoot(), // Habilita el sistema de cron jobs
    BondaModule, // Para obtener cupones de Bonda
    SupabaseModule, // Para leer/escribir en Supabase
  ],
  controllers: [PublicController],
  providers: [SyncCuponesService], // Registra el servicio de sync
})
export class PublicModule {}
