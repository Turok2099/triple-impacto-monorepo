/**
 * API Client para Pagos con Fiserv Connect
 * Maneja la creación de transacciones y el envío del formulario a Fiserv
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// ============================================
// TIPOS / INTERFACES
// ============================================

export interface CrearTransaccionRequest {
  amount: number;
  currency?: string;
  organizacion_id?: string;
  responseSuccessURL: string;
  responseFailURL: string;
  transactionNotificationURL?: string;
}

export interface CrearTransaccionResponse {
  gatewayUrl: string;
  formParams: Record<string, string>;
}

export interface Organizacion {
  id: string;
  nombre: string;
  descripcion?: string;
  logo_url?: string;
  website_url?: string;
  monto_minimo?: number;
  monto_sugerido?: number;
  activa: boolean;
}

// ============================================
// FUNCIONES DEL API
// ============================================

/**
 * Crea una transacción de pago en Fiserv Connect
 * Requiere token JWT del usuario autenticado
 * 
 * @param data - Datos de la transacción (monto, organización, URLs de retorno)
 * @param token - Token JWT del usuario
 * @returns Respuesta con URL del gateway y parámetros del formulario
 */
export async function crearTransaccion(
  data: CrearTransaccionRequest,
  token: string,
): Promise<CrearTransaccionResponse> {
  const response = await fetch(`${API_URL}/payments/fiserv/crear-transaccion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al crear transacción de pago');
  }

  return response.json();
}

/**
 * Obtiene la lista de organizaciones activas para seleccionar al donar
 * No requiere autenticación (es información pública)
 */
export async function obtenerOrganizaciones(): Promise<Organizacion[]> {
  const response = await fetch(`${API_URL}/public/organizaciones`);

  if (!response.ok) {
    throw new Error('Error al obtener organizaciones');
  }

  return response.json();
}

/**
 * Envía el formulario de pago a Fiserv Connect
 * Crea un formulario HTML dinámico con los parámetros y lo envía por POST
 * El usuario será redirigido a la página de pago de Fiserv
 * 
 * @param gatewayUrl - URL del gateway de Fiserv Connect
 * @param formParams - Parámetros del formulario (incluye hashExtended, etc.)
 */
export function enviarFormularioFiserv(
  gatewayUrl: string,
  formParams: Record<string, string>,
): void {
  // Crear formulario dinámicamente
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = gatewayUrl;

  // Agregar todos los parámetros como inputs ocultos
  Object.entries(formParams).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  // Agregar el formulario al body y enviarlo
  document.body.appendChild(form);
  form.submit();
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Formatea un monto en pesos argentinos
 */
export function formatearMonto(monto: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(monto);
}

/**
 * Valida que un monto sea válido
 */
export function validarMonto(monto: number, montoMinimo?: number): string | null {
  if (isNaN(monto) || monto <= 0) {
    return 'El monto debe ser mayor a 0';
  }

  if (montoMinimo && monto < montoMinimo) {
    return `El monto mínimo es ${formatearMonto(montoMinimo)}`;
  }

  return null;
}

/**
 * Obtiene las URLs de retorno según el entorno
 */
export function obtenerURLsRetorno(): { successURL: string; errorURL: string } {
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';

  return {
    successURL: `${baseUrl}/donar/success`,
    errorURL: `${baseUrl}/donar/error`,
  };
}
