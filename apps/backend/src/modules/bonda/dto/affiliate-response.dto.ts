/**
 * DTO para las respuestas de la API de Bonda (Afiliados)
 */

export class BondaErrorDetail {
  [key: string]: string[];
}

export class BondaError {
  detail?: BondaErrorDetail;
  code: string;
}

export class BondaAffiliateResponse {
  success: boolean;
  error?: BondaError;
  data?: any;
}

export class BondaDeleteResponse {
  success: boolean;
  data?: {
    deleted: number;
  };
  error?: BondaError;
}
