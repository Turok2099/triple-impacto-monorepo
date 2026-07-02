import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SsoSyncDto {
  @IsString()
  @IsNotEmpty()
  dni: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  provincia?: string;

  @IsString()
  @IsOptional()
  localidad?: string;
}
