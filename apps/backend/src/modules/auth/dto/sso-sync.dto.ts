import { IsString, IsOptional } from 'class-validator';

export class SsoSyncDto {
  @IsString()
  @IsOptional()
  dni?: string;

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
