import { Module } from '@nestjs/common';
import { FiservRestService } from './fiserv-rest.service';
import { FiservRestController } from './fiserv-rest.controller';
import { SupabaseModule } from '../../supabase/supabase.module';

import { FiservHomologationController } from './fiserv-homologation.controller';

@Module({
  imports: [SupabaseModule],
  providers: [FiservRestService],
  controllers: [FiservRestController, FiservHomologationController],
  exports: [FiservRestService],
})
export class FiservRestModule {}
