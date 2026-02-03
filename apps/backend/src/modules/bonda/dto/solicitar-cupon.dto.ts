import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

/**
 * DTO para solicitar un cupón específico de Bonda
 */
export class SolicitarCuponDto {
  @IsNotEmpty()
  @IsString()
  bondaCuponId: string; // ID del cupón en Bonda

  @IsNotEmpty()
  @IsString()
  codigoAfiliado: string; // Código de afiliado del usuario

  @IsNotEmpty()
  @IsString()
  micrositioSlug: string; // Slug del micrositio de Bonda

  @IsOptional()
  @IsString()
  celular?: string; // Opcional: celular para recibir SMS (si Bonda lo requiere)
}
