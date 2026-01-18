import { IsString, IsNotEmpty } from 'class-validator';

export class GetCuponesQueryDto {
  @IsString()
  @IsNotEmpty()
  codigoAfiliado: string;
}
