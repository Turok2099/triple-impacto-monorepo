export class AuthResponseDto {
  user: {
    id: string;
    nombre: string;
    email: string;
    bondaCode: string;
  };
  token: string;
}

export class UserDto {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  provincia?: string;
  localidad?: string;
  bondaCode: string;
  verificado: boolean;
  createdAt: string;
}
