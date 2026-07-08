import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FiservQrService } from './fiserv-qr.service';
import { computeCRC16 } from '../fiserv-connect/utils/crc16.util';

describe('FiservQrService', () => {
  let service: FiservQrService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'fiserv.qrServiceSubcode': 'Y1234567',
        'fiserv.qrCommerceCuit': '30692264785',
        'fiserv.qrMcc': '7399',
        'fiserv.qrCity': 'Buenos Aires',
        'fiserv.qrPostalCode': 'C1000AAB',
        'fiserv.qrDomain': 'ar.com.ayni',
        'environment': 'development',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FiservQrService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<FiservQrService>(FiservQrService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('computeCRC16', () => {
    it('should compute correct CRC16 for standard values', () => {
      // Valor de prueba común para validar algoritmos CRC16 CCITT
      const testString = '123456789';
      // CRC16 CCITT-FALSE para '123456789' es 29B1
      const crc = computeCRC16(testString);
      expect(crc).toBe('29B1');
    });
  });

  describe('generateDynamicQr and extractOrderIdFromQr', () => {
    it('should generate a valid EMVCo QR string and correctly extract the order ID', () => {
      const amount = 1500.50;
      const orderId = 'test-order-id-12345';
      const merchantName = 'Fundación Ayni';

      const qrString = service.generateDynamicQr(amount, orderId, merchantName);

      // Verificaciones básicas del formato EMVCo
      expect(qrString.startsWith('000201010212')).toBe(true);
      expect(qrString.includes('6304')).toBe(true); // Debe contener el tag de CRC
      expect(qrString.length).toBeGreaterThan(50);

      // El campo 54 (monto) debe tener la forma 54071500.50
      expect(qrString).toContain('54071500.50');

      // El campo 59 (nombre comercio sanitizado sin acentos)
      expect(qrString).toContain('5914Fundacion Ayni');

      // Extraer el order ID de vuelta
      const extractedId = service.extractOrderIdFromQr(qrString);
      expect(extractedId).toBe(orderId);
    });

    it('should handle order ID truncation safely (limit of 25 characters)', () => {
      const amount = 500;
      const longOrderId = 'this-is-a-very-long-order-id-that-exceeds-twenty-five';
      const expectedTruncatedId = longOrderId.substring(0, 25); // 'this-is-a-very-long-order'

      const qrString = service.generateDynamicQr(amount, longOrderId);
      const extractedId = service.extractOrderIdFromQr(qrString);

      expect(extractedId).toBe(expectedTruncatedId);
      expect(extractedId?.length).toBe(25);
    });
  });
});
