import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BondaController } from './bonda.controller';
import { BondaService } from './bonda.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    forwardRef(() => AuthModule),
  ],
  controllers: [BondaController],
  providers: [BondaService],
  exports: [BondaService],
})
export class BondaModule {}
