import {
  IsNumber,
  IsString,
  IsOptional,
  IsUUID,
  Min,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CrearTransaccionDto {
  @IsNumber()
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsUUID('4', { message: 'organizacion_id debe ser un UUID válido' })
  @IsOptional()
  organizacion_id?: string;

  @IsString()
  @Matches(/^https?:\/\/.+/, {
    message:
      'responseSuccessURL debe ser una URL válida con http:// o https://',
  })
  responseSuccessURL: string;

  @IsString()
  @Matches(/^https?:\/\/.+/, {
    message: 'responseFailURL debe ser una URL válida con http:// o https://',
  })
  responseFailURL: string;

  /**
   * URL para notificación servidor a servidor (webhook).
   * Si no se envía, el backend puede armarla con API_BASE_URL + /api/payments/fiserv/notification.
   */
  @IsString()
  @Matches(/^https?:\/\/.+/, {
    message:
      'transactionNotificationURL debe ser una URL válida con http:// o https://',
  })
  @IsOptional()
  transactionNotificationURL?: string;
}
