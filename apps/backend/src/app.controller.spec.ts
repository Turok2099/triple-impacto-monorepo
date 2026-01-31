import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API welcome message', () => {
      const result = appController.getHello();
      expect(result).toEqual({
        message: 'Bienvenido a la API de Triple Impacto',
        version: '1.0.0',
        documentation: '/api',
      });
    });
  });
});
