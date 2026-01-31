// Servicio para conectar con el API de Bonda (backend)

import { CuponesResponseDto, PublicCouponDto } from './types/cupon';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const TEST_AFFILIATE_CODE = process.env.NEXT_PUBLIC_TEST_AFFILIATE_CODE || '202';

/** Slug por defecto para cupones Bonda cuando no hay contexto de organización */
const DEFAULT_MICROSITE =
  process.env.NEXT_PUBLIC_BONDA_DEFAULT_MICROSITE || 'club-impacto-proyectar';

/**
 * Catálogo público de cupones (Estado 1 – Visitantes). Sin códigos.
 * GET /api/public/cupones
 */
export async function obtenerCuponesPublicos(): Promise<PublicCouponDto[]> {
  try {
    const response = await fetch(`${API_URL}/public/cupones`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener cupones públicos: ${response.statusText}`);
    }

    return response.json();
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
