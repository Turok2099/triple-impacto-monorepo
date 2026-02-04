// Servicio para conectar con el API de Bonda (backend)

import { CuponesResponseDto, PublicCouponDto } from './types/cupon';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const TEST_AFFILIATE_CODE = process.env.NEXT_PUBLIC_TEST_AFFILIATE_CODE || '202';

/** Slug por defecto para cupones Bonda cuando no hay contexto de organización */
const DEFAULT_MICROSITE =
  process.env.NEXT_PUBLIC_BONDA_DEFAULT_MICROSITE || 'club-impacto-proyectar';

/**
 * Catálogo público de cupones desde Bonda API (Estado 1 – Visitantes). Sin códigos.
 * GET /api/public/cupones-bonda
 * 
 * Este endpoint llama directamente a Bonda API con filtros en tiempo real,
 * mostrando los 1600+ cupones disponibles de Fundación Padres.
 * 
 * @param categoria - ID de categoría para filtrar (opcional)
 * @param orderBy - Ordenamiento: 'relevant' | 'latest' (default: relevant)
 */
export async function obtenerCuponesPublicos(
  categoria?: number,
  orderBy?: 'relevant' | 'latest'
): Promise<PublicCouponDto[]> {
  try {
    const params = new URLSearchParams();
    if (categoria) params.append('categoria', categoria.toString());
    if (orderBy) params.append('orderBy', orderBy);

    const url = `${API_URL}/public/cupones-bonda${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener cupones públicos: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transformar respuesta de Bonda al formato PublicCouponDto
    return data.cupones.map((cupon: any) => ({
      id: cupon.id,
      titulo: cupon.nombre,
      descripcion: `${cupon.descuento} de descuento en ${cupon.empresa}`,
      descuento: cupon.descuento,
      imagen_url: cupon.imagen_url,
      empresa: cupon.empresa,
      categoria: null, // TODO: Mapear categoría desde respuesta de Bonda
      orden: 0,
      activo: true,
      created_at: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error en obtenerCuponesPublicos:', error);
    throw error;
  }
}

/**
 * Obtiene los cupones del usuario logueado para un micrositio/ONG.
 * El backend resuelve el affiliate_code desde usuarios_bonda_afiliados (user + microsite).
 * Requiere token. Si el usuario no tiene afiliado en ese micrositio, el backend responde 404.
 *
 * @param microsite - Slug del micrositio Bonda (ej. club-impacto-proyectar). Si no se pasa, se usa DEFAULT_MICROSITE.
 */
export async function obtenerCuponesPorUsuario(
  microsite?: string,
): Promise<CuponesResponseDto> {
  const slug = microsite ?? DEFAULT_MICROSITE;
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token) {
    throw new Error('Se requiere autenticación para obtener cupones');
  }

  const url = `${API_URL}/bonda/cupones?microsite=${encodeURIComponent(slug)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const text = await response.text();
    let msg = `Error al obtener cupones: ${response.statusText}`;
    try {
      const body = JSON.parse(text);
      if (body.message) msg = body.message;
    } catch {
      if (text) msg = text;
    }
    throw new Error(msg);
  }

  return response.json();
}

/**
 * Obtiene los cupones usando un código de afiliado explícito (compatibilidad/admin).
 * @param codigoAfiliado - Código de afiliado
 * @param microsite - Slug del micrositio Bonda. Si no se pasa, se usa DEFAULT_MICROSITE.
 */
export async function obtenerCuponesConCodigo(
  codigoAfiliado: string = TEST_AFFILIATE_CODE,
  microsite?: string,
): Promise<CuponesResponseDto> {
  const slug = microsite ?? DEFAULT_MICROSITE;
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const url = `${API_URL}/bonda/cupones/${codigoAfiliado}?microsite=${encodeURIComponent(slug)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Error al obtener cupones: ${response.statusText}`);
  }
  return response.json();
}
