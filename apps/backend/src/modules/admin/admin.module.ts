import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { BondaModule } from '../bonda/bonda.module';

@Module({
  imports: [SupabaseModule, BondaModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
