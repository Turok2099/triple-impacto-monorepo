import {
  IsNumber,
  IsString,
  IsOptional,
  IsUUID,
  Min,
  IsUrl,
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
  @IsUrl({}, { message: 'responseSuccessURL debe ser una URL válida' })
  responseSuccessURL: string;

  @IsString()
  @IsUrl({}, { message: 'responseFailURL debe ser una URL válida' })
  responseFailURL: string;

  /**
   * URL para notificación servidor a servidor (webhook).
   * Si no se envía, el backend puede armarla con API_BASE_URL + /api/payments/fiserv/notification.
   */
  @IsString()
  @IsUrl({}, { message: 'transactionNotificationURL debe ser una URL válida' })
  @IsOptional()
  transactionNotificationURL?: string;
}
