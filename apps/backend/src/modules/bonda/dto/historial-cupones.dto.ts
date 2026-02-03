import { CuponSolicitadoDto } from './cupon-solicitado.dto';

/**
 * DTO para respuesta del historial de cupones
 */
export class HistorialCuponesDto {
  cupones: CuponSolicitadoDto[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

/**
 * DTO para query params del historial
 */
export class HistorialCuponesQueryDto {
  pagina?: number = 1;
  limite?: number = 20;
  estado?: 'activo' | 'usado' | 'vencido' | 'cancelado' | 'todos' = 'todos';
}
