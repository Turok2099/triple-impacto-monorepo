// Servicio para conectar con el API de Bonda (backend)

import { CuponesResponseDto } from './types/cupon';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const TEST_AFFILIATE_CODE = process.env.NEXT_PUBLIC_TEST_AFFILIATE_CODE || '202';

/**
 * Obtiene los cupones recibidos por un usuario afiliado
 * @param codigoAfiliado - Código de afiliado del usuario
 * @returns Promise con la respuesta de cupones
 */
export async function obtenerCupones(
  codigoAfiliado: string = TEST_AFFILIATE_CODE,
): Promise<CuponesResponseDto> {
  try {
    const response = await fetch(
      `${API_URL}/bonda/cupones/${codigoAfiliado}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Error al obtener cupones: ${response.statusText}`);
    }

    const data: CuponesResponseDto = await response.json();
    return data;
  } catch (error) {
    console.error('Error en obtenerCupones:', error);
    throw error;
  }
}
