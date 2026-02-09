// Servicio para conectar con el API de Bonda (backend)

import { CuponesResponseDto, PublicCouponDto, CategoriaDto, CuponDto } from "./types/cupon";

// Re-export tipos para conveniencia
export type { PublicCouponDto, CategoriaDto, CuponesResponseDto, CuponDto };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
const TEST_AFFILIATE_CODE =
  process.env.NEXT_PUBLIC_TEST_AFFILIATE_CODE || "202";

/** Slug por defecto para cupones Bonda cuando no hay contexto de organización */
const DEFAULT_MICROSITE =
  process.env.NEXT_PUBLIC_BONDA_DEFAULT_MICROSITE || "club-impacto-proyectar";

/**
 * Obtiene las categorías disponibles para filtrar cupones.
 * GET /api/public/categorias-bonda
 * 
 * @returns Array de categorías con id, nombre y parent_id
 */
export async function obtenerCategorias(): Promise<CategoriaDto[]> {
  try {
    const url = `${API_URL}/public/categorias-bonda`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(
        `Error al obtener categorías: ${response.statusText}`
      );
    }

    return response.json();
  } catch (error) {
    console.error("Error en obtenerCategorias:", error);
    throw error;
  }
}

/**
 * Catálogo público de cupones desde Supabase (sincronizados desde Bonda).
 * GET /api/public/cupones-bonda
 *
 * Este endpoint lee cupones desde Supabase que fueron sincronizados desde Bonda,
 * mostrando los 1600+ cupones disponibles de Fundación Padres.
 *
 * @param categoria - Nombre de categoría para filtrar (opcional, ej. "Gastronomía")
 * @param orderBy - Ordenamiento: 'relevant' | 'latest' (default: relevant)
 * @param busqueda - Término de búsqueda para filtrar por nombre o empresa
 */
export async function obtenerCuponesPublicos(
  categoria?: string,
  orderBy?: "relevant" | "latest",
  busqueda?: string
): Promise<PublicCouponDto[]> {
  try {
    const params = new URLSearchParams();
    if (categoria) params.append("categoria", categoria);
    if (orderBy) params.append("orderBy", orderBy);
    if (busqueda) params.append("busqueda", busqueda);

    const url = `${API_URL}/public/cupones-bonda${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(
        `Error al obtener cupones públicos: ${response.statusText}`
      );
    }

    const data = await response.json();

    // Transformar respuesta del backend al formato PublicCouponDto
    return data.cupones.map((cupon: any) => ({
      id: cupon.id,
      titulo: cupon.nombre,
      descripcion:
        cupon.descripcion ??
        (cupon.descuento && cupon.empresa?.nombre
          ? `${cupon.descuento} en ${cupon.empresa.nombre}`
          : null),
      descuento: cupon.descuento,
      imagen_url: cupon.imagen_url,
      logo_empresa: cupon.logo_empresa ?? null,
      empresa: cupon.empresa?.nombre || cupon.empresa || null,
      categoria: cupon.categoria_principal || null,
      orden: 0,
      activo: true,
      created_at: new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error en obtenerCuponesPublicos:", error);
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
  microsite?: string
): Promise<CuponesResponseDto> {
  const slug = microsite ?? DEFAULT_MICROSITE;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  if (!token) {
    throw new Error("Se requiere autenticación para obtener cupones");
  }

  const url = `${API_URL}/bonda/cupones?microsite=${encodeURIComponent(slug)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
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
  microsite?: string
): Promise<CuponesResponseDto> {
  const slug = microsite ?? DEFAULT_MICROSITE;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const url = `${API_URL}/bonda/cupones/${codigoAfiliado}?microsite=${encodeURIComponent(
    slug
  )}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Error al obtener cupones: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Obtiene los últimos 25 cupones recibidos/solicitados por el usuario.
 * Este endpoint llama a /api/cupones_recibidos de Bonda.
 * Requiere autenticación y que el usuario tenga un código de afiliado.
 * 
 * @param microsite - Slug del micrositio (opcional, usa DEFAULT_MICROSITE si no se pasa)
 * @returns Los cupones que el usuario ha solicitado/recibido
 */
export async function obtenerCuponesRecibidos(
  microsite?: string
): Promise<CuponesResponseDto> {
  const slug = microsite ?? DEFAULT_MICROSITE;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  
  if (!token) {
    throw new Error("Se requiere autenticación para obtener cupones recibidos");
  }

  const url = `${API_URL}/bonda/cupones-recibidos?microsite=${encodeURIComponent(slug)}`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const text = await response.text();
    let msg = `Error al obtener cupones recibidos: ${response.statusText}`;
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
