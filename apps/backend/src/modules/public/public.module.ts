import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PublicController } from './public.controller';
import { SyncCuponesService } from './sync-cupones.service';
import { BondaModule } from '../bonda/bonda.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [
    ScheduleModule.forRoot(), // Habilita el sistema de cron jobs
    BondaModule, // Para obtener cupones de Bonda
    SupabaseModule, // Para leer/escribir en Supabase
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [PublicController],
  providers: [SyncCuponesService], // Registra el servicio de sync
})
export class PublicModule {}
