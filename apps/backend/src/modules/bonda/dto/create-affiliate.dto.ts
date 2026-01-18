import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

/**
 * DTO para crear un afiliado en Bonda
 * 
 * Según la documentación de Bonda, el único campo requerido es "code".
 * Los campos adicionales dependen de la configuración del micrositio.
 * 
 * Consultar con el ejecutivo de implementaciones de Bonda para obtener
 * el listado completo de campos permitidos en:
 * Panel de administración → Usuarios → Administracion Masiva → Agregar → Ver Referencias
 */
export class CreateAffiliateDto {
  @IsString()
  @IsNotEmpty()
  code: string; // Código único del afiliado (REQUERIDO)

  @IsEmail()
  @IsOptional()
  email?: string; // Email del afiliado

  @IsString()
  @IsOptional()
  nombre?: string; // Nombre completo

  @IsString()
  @IsOptional()
  telefono?: string; // Teléfono con código de área

  @IsString()
  @IsOptional()
  provincia?: string; // Provincia de residencia

  @IsString()
  @IsOptional()
  localidad?: string; // Localidad/Ciudad

  // Agregar aquí más campos según lo que Bonda permita en su micrositio
  // Consultar la documentación de referencias de Bonda
}
