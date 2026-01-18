import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BondaController } from './bonda.controller';
import { BondaService } from './bonda.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [BondaController],
  providers: [BondaService],
  exports: [BondaService],
})
export class BondaModule {}
