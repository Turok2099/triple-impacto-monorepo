export class EmpresaDto {
  id: string;
  nombre: string;
  logoThumbnail?: {
    '90x90': string;
  };
}

export class ImagenesDto {
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

export class EnvioDto {
  codigoId: string;
  smsId?: string;
  codigo?: string | null;
  operadora?: string;
  celular?: string;
  mensaje?: string;
  fecha?: string;
}

export class CuponDto {
  id: string;
  nombre: string;
  descuento: string;
  /** Descripción breve del beneficio (ej. "10% de descuento en toda la tienda") */
  descripcionBreve?: string;
  codigoAfiliado: string;
  micrositioId: string;
  incluirCodigo: string;
  empresa: EmpresaDto;
  imagenes: ImagenesDto;
  envio?: EnvioDto;
}
