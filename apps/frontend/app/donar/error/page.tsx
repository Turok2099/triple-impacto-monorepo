'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PagoErrorPage() {
  const searchParams = useSearchParams();

  // Intentar obtener información del error de los parámetros
  const failReason = searchParams.get('failReason') || searchParams.get('fail_reason');
  const responseCode = searchParams.get('response_code');
  const oid = searchParams.get('oid');

  // Mapeo de códigos de error comunes
  const getMensajeError = (reason?: string | null, code?: string | null) => {
    if (reason?.toLowerCase().includes('cancel')) {
      return {
        titulo: 'Pago Cancelado',
        descripcion:
          'Cancelaste el proceso de pago. No se realizó ningún cargo a tu tarjeta.',
        icono: '🚫',
      };
    }

    if (code === '202' || reason?.toLowerCase().includes('declined')) {
      return {
        titulo: 'Pago Rechazado',
        descripcion:
          'Tu banco rechazó la transacción. Por favor, verifica los datos de tu tarjeta o intenta con otro método de pago.',
        icono: '❌',
      };
    }

    if (code === '203' || reason?.toLowerCase().includes('insufficient')) {
      return {
        titulo: 'Fondos Insuficientes',
        descripcion:
          'Tu tarjeta no tiene fondos suficientes para completar la transacción.',
        icono: '💳',
      };
    }

    // Error genérico
    return {
      titulo: 'Error en el Pago',
      descripcion:
        'Hubo un problema al procesar tu pago. No te preocupes, no se realizó ningún cargo.',
      icono: '⚠️',
    };
  };

  const errorInfo = getMensajeError(failReason, responseCode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Mensaje de error */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header con icono de error */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-8 text-center text-white">
            <div className="text-6xl mb-4">{errorInfo.icono}</div>
            <h1 className="text-3xl font-bold mb-2">{errorInfo.titulo}</h1>
            <p className="text-red-100 text-lg">{errorInfo.descripcion}</p>
          </div>

          {/* Contenido */}
          <div className="p-8">
            {/* Información técnica (si disponible) */}
            {(failReason || responseCode || oid) && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h2 className="font-bold text-gray-900 mb-4">
                  Detalles técnicos
                </h2>
                <div className="space-y-2 text-sm">
                  {oid && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Número de orden:</span>
                      <span className="font-mono text-xs text-gray-700">{oid}</span>
                    </div>
                  )}
                  {responseCode && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Código de respuesta:</span>
                      <span className="font-mono text-gray-900">{responseCode}</span>
                    </div>
                  )}
                  {failReason && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Razón:</span>
                      <span className="text-gray-900">{failReason}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Posibles soluciones */}
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h2 className="font-bold text-blue-900 mb-3">
                💡 ¿Qué puedo hacer?
              </h2>
              <ul className="space-y-2 text-sm text-blue-900">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>
                    Verifica que los datos de tu tarjeta sean correctos (número,
                    fecha de vencimiento, CVV)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>
                    Asegúrate de tener fondos suficientes en tu cuenta
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>
                    Intenta con otra tarjeta o método de pago
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>
                    Contacta a tu banco para verificar que no haya bloqueos
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>
                    Si el problema persiste, contactanos a{' '}
                    <a
                      href="mailto:soporte@tripleimpacto.site"
                      className="text-blue-700 hover:text-blue-800 underline"
                    >
                      soporte@tripleimpacto.site
                    </a>
                  </span>
                </li>
              </ul>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/donar"
                className="flex-1 py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all text-center shadow-lg"
              >
                🔄 Intentar Nuevamente
              </Link>
              <Link
                href="/"
                className="flex-1 py-4 px-6 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all text-center"
              >
                Volver al inicio
              </Link>
            </div>

            {/* Nota de seguridad */}
            <div className="mt-6 p-4 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600 text-center">
                <strong>No se realizó ningún cargo.</strong> Tu información está
                protegida y el pago no fue procesado.
              </p>
            </div>
          </div>
        </div>

        {/* Ayuda adicional */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="font-bold text-gray-900 mb-4 text-center">
            ¿Necesitás ayuda?
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="text-center p-4">
              <div className="text-3xl mb-2">📧</div>
              <h4 className="font-medium text-gray-900 mb-1">Email</h4>
              <a
                href="mailto:soporte@tripleimpacto.site"
                className="text-purple-600 hover:text-purple-700"
              >
                soporte@tripleimpacto.site
              </a>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">❓</div>
              <h4 className="font-medium text-gray-900 mb-1">Preguntas</h4>
              <Link
                href="/faqs"
                className="text-purple-600 hover:text-purple-700"
              >
                Ver preguntas frecuentes
              </Link>
            </div>
          </div>
        </div>

        {/* Métodos de pago aceptados */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 mb-2">Aceptamos:</p>
          <div className="flex justify-center gap-4 items-center">
            <div className="text-gray-400 text-sm">Visa</div>
            <div className="text-gray-400">•</div>
            <div className="text-gray-400 text-sm">Mastercard</div>
            <div className="text-gray-400">•</div>
            <div className="text-gray-400 text-sm">American Express</div>
            <div className="text-gray-400">•</div>
            <div className="text-gray-400 text-sm">Cabal</div>
          </div>
        </div>
      </div>
    </div>
  );
}
