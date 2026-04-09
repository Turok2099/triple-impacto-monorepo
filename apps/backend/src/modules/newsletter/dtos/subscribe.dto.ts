import { IsEmail, IsNotEmpty } from 'class-validator';

export class SubscribeDto {
  @IsEmail({}, { message: 'El correo electrónico proporcionado no es un formato válido.' })
  @IsNotEmpty({ message: 'El correo es obligatorio.' })
  email: string;
}
