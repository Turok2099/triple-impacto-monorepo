import { Module } from '@nestjs/common';
import { FiservRestService } from './fiserv-rest.service';
import { FiservRestController } from './fiserv-rest.controller';
import { SupabaseModule } from '../../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [FiservRestService],
  controllers: [FiservRestController],
  exports: [FiservRestService],
})
export class FiservRestModule {}
