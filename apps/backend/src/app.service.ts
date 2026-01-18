import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      message: 'Bienvenido a la API de Triple Impacto',
      version: '1.0.0',
      documentation: '/api',
    };
  }
}
