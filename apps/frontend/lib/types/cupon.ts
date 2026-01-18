// Tipos para cupones basados en la respuesta del backend (Bonda)

export interface EmpresaDto {
  id: string;
  nombre: string;
  logoThumbnail?: {
    '90x90': string;
  };
}

export interface ImagenesDto {
  thumbnail?: {
    '90x90': string;
  };
  principal?: {
    '280x190': string;
  };
  apaisada?: {
    '240x80': string;
  };
}

export interface EnvioDto {
  codigoId: string;
  smsId?: string;
  codigo?: string | null;
  operadora?: string;
  celular?: string;
  mensaje?: string;
  fecha?: string;
}

export interface CuponDto {
  id: string;
  nombre: string;
  descuento: string;
  codigoAfiliado: string;
  micrositioId: string;
  incluirCodigo: string;
  empresa: EmpresaDto;
  imagenes: ImagenesDto;
  envio?: EnvioDto;
}

export interface CuponesResponseDto {
  count: number;
  cupones: CuponDto[];
}
