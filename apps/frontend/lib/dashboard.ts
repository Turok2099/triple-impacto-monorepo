/**
 * API Client para Dashboard de Cupones
 * Maneja todas las llamadas al backend para el dashboard del usuario
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// ============================================
// TIPOS / INTERFACES
// ============================================

export interface CuponSolicitado {
  id: string;
  bondaCuponId: string;
  nombre: string;
  descuento: string;
  empresaNombre: string;
  empresaId?: string;
  codigo?: string | null;
  codigoId?: string | null;
  estado: 'activo' | 'usado' | 'vencido' | 'cancelado';
  usadoAt?: string | null;
  mensaje?: string | null;
  operadora?: string | null;
  celular?: string | null;
  imagenThumbnail?: string | null;
  imagenPrincipal?: string | null;
  imagenApaisada?: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string | null;
  micrositioSlug?: string | null;
}

export interface EstadisticasUsuario {
  cuponesActivos: number;
  cuponesUsados: number;
  totalCuponesSolicitados: number;
  ultimoCuponSolicitado?: string | null;
  totalDonado?: number;
}

export interface DashboardUsuario {
  usuario: {
    id: string;
    nombre: string;
    email: string;
  };
  estadisticas: EstadisticasUsuario;
  cuponesActivos: CuponSolicitado[];
  cuponesRecientes: CuponSolicitado[];
}

export interface HistorialCupones {
  cupones: CuponSolicitado[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export interface SolicitarCuponRequest {
  bondaCuponId: string;
  codigoAfiliado: string;
  micrositioSlug: string;
  celular?: string;
}

// ============================================
// FUNCIONES DEL API
// ============================================

/**
 * Solicitar un cupón específico de Bonda
 * El cupón se guarda en el dashboard del usuario con el código visible
 */
export async function solicitarCupon(
  data: SolicitarCuponRequest,
  token: string,
): Promise<CuponSolicitado> {
  const response = await fetch(`${API_URL}/bonda/solicitar-cupon`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al solicitar cupón');
  }

  return response.json();
}

/**
 * Obtener cupones activos del usuario
 * Retorna cupones que están activos (no usados, no vencidos)
 */
export async function obtenerMisCupones(
  token: string,
): Promise<CuponSolicitado[]> {
  const response = await fetch(`${API_URL}/bonda/mis-cupones`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener cupones activos');
  }

  return response.json();
}

/**
 * Obtener dashboard completo del usuario
 * Incluye estadísticas, cupones activos y recientes
 */
export async function obtenerDashboard(
  token: string,
): Promise<DashboardUsuario> {
  const response = await fetch(`${API_URL}/bonda/dashboard`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener dashboard');
  }

  return response.json();
}

/**
 * Obtener historial de cupones con paginación
 */
export async function obtenerHistorialCupones(
  token: string,
  opciones?: {
    pagina?: number;
    limite?: number;
    estado?: 'activo' | 'usado' | 'vencido' | 'cancelado' | 'todos';
  },
): Promise<HistorialCupones> {
  const params = new URLSearchParams();
  if (opciones?.pagina) params.append('pagina', opciones.pagina.toString());
  if (opciones?.limite) params.append('limite', opciones.limite.toString());
  if (opciones?.estado) params.append('estado', opciones.estado);

  const url = `${API_URL}/bonda/historial-cupones${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener historial de cupones');
  }

  return response.json();
}

/**
 * Marcar un cupón como usado
 */
export async function marcarCuponComoUsado(
  cuponId: string,
  token: string,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_URL}/bonda/cupones/${cuponId}/usar`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al marcar cupón como usado');
  }

  return response.json();
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Formatear fecha en español
 */
export function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formatear fecha corta
 */
export function formatearFechaCorta(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Copiar texto al portapapeles
 */
export async function copiarAlPortapapeles(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (error) {
    console.error('Error al copiar al portapapeles:', error);
    return false;
  }
}

/**
 * Obtener color según estado del cupón
 */
export function obtenerColorEstado(
  estado: CuponSolicitado['estado'],
): string {
  switch (estado) {
    case 'activo':
      return 'bg-green-100 text-green-800';
    case 'usado':
      return 'bg-gray-100 text-gray-800';
    case 'vencido':
      return 'bg-red-100 text-red-800';
    case 'cancelado':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Obtener etiqueta en español según estado
 */
export function obtenerEtiquetaEstado(
  estado: CuponSolicitado['estado'],
): string {
  switch (estado) {
    case 'activo':
      return 'Activo';
    case 'usado':
      return 'Usado';
    case 'vencido':
      return 'Vencido';
    case 'cancelado':
      return 'Cancelado';
    default:
      return 'Desconocido';
  }
}
