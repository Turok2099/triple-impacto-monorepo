import { IsString, IsEmail, IsOptional } from 'class-validator';

/**
 * DTO para actualizar un afiliado en Bonda
 * 
 * SOLO se deben enviar los campos que deseen editarse.
 * El campo "code" NO puede ser actualizado (es el identificador).
 */
export class UpdateAffiliateDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  provincia?: string;

  @IsString()
  @IsOptional()
  localidad?: string;

  // Agregar aquí más campos según lo que Bonda permita actualizar
}
