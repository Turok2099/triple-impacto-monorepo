/**
 * DTO para un cupón solicitado por el usuario
 * Incluye el CÓDIGO visible en el dashboard
 */
export class CuponSolicitadoDto {
  id: string; // UUID en nuestra BD
  bondaCuponId: string;
  nombre: string;
  descuento: string;
  empresaNombre: string;
  empresaId?: string;

  // ⭐ EL CÓDIGO - Lo más importante
  codigo?: string | null;
  codigoId?: string | null;

  // Estado
  estado: 'activo' | 'usado' | 'vencido' | 'cancelado';
  usadoAt?: string | null;

  // Información adicional
  mensaje?: string | null;
  operadora?: string | null;
  celular?: string | null;

  // Imágenes
  imagenThumbnail?: string | null;
  imagenPrincipal?: string | null;
  imagenApaisada?: string | null;

  // Metadatos
  createdAt: string;
  updatedAt: string;
  expiresAt?: string | null;

  // Info del micrositio
  micrositioSlug?: string | null;
}

/**
 * DTO para estadísticas del dashboard del usuario
 */
export class EstadisticasUsuarioDto {
  cuponesActivos: number;
  cuponesUsados: number;
  totalCuponesSolicitados: number;
  ultimoCuponSolicitado?: string | null;
  totalDonado?: number; // Opcional: agregar monto total donado
}

/**
 * DTO para el dashboard completo del usuario
 */
export class DashboardUsuarioDto {
  usuario: {
    id: string;
    nombre: string;
    email: string;
  };
  estadisticas: EstadisticasUsuarioDto;
  cuponesActivos: CuponSolicitadoDto[];
  cuponesRecientes: CuponSolicitadoDto[]; // Últimos 5
}

/**
 * DTO para marcar un cupón como usado
 */
export class MarcarCuponUsadoDto {
  cuponId: string;
}
