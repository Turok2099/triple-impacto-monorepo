import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { BondaModule } from './modules/bonda/bonda.module';
import { SupabaseModule } from './modules/supabase/supabase.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [ConfigModule, SupabaseModule, BondaModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
