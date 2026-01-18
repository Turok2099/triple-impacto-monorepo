import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateExampleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
