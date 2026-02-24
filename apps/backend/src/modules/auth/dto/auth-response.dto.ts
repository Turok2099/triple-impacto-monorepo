export class AuthResponseDto {
  user: {
    id: string;
    nombre: string;
    email: string;
    bondaCode: string | null;
    telefono?: string | null;
    dni?: string | null;
    provincia?: string | null;
    localidad?: string | null;
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
