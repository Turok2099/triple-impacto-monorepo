'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function PagoExitosoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [verificando, setVerificando] = useState(true);

  // Parámetros que Fiserv envía en la redirección
  const approval_code = searchParams.get('approval_code');
  const oid = searchParams.get('oid');
  const chargetotal = searchParams.get('chargetotal');

  useEffect(() => {
    // Verificar que tenemos los parámetros necesarios
    if (!approval_code || !oid) {
      // Si no hay parámetros, redirigir a página de error
      router.push('/donar/error');
      return;
    }

    // Dar un tiempo para que el webhook procese el pago
    const timer = setTimeout(() => {
      setVerificando(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [approval_code, oid, router]);

  if (verificando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verificando tu pago...
          </h2>
          <p className="text-gray-600">
            Estamos confirmando tu donación. Por favor, espera un momento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Mensaje de éxito */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header con icono de éxito */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-center text-white">
            <div className="text-6xl mb-4">✓</div>
            <h1 className="text-3xl font-bold mb-2">¡Donación Exitosa!</h1>
            <p className="text-green-100 text-lg">
              Gracias por tu generosidad y compromiso
            </p>
          </div>

          {/* Contenido */}
          <div className="p-8">
            {/* Información de la transacción */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h2 className="font-bold text-gray-900 mb-4">
                Detalles de tu donación
              </h2>
              <div className="space-y-2 text-sm">
                {chargetotal && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monto:</span>
                    <span className="font-bold text-gray-900">
                      ${parseFloat(chargetotal).toLocaleString('es-AR')} ARS
                    </span>
                  </div>
                )}
                {approval_code && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Código de aprobación:</span>
                    <span className="font-mono text-gray-900">{approval_code}</span>
                  </div>
                )}
                {oid && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Número de orden:</span>
                    <span className="font-mono text-xs text-gray-700">{oid}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Beneficios activados */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 mb-6">
              <h2 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">🎁</span>
                ¡Beneficios activados!
              </h2>
              <div className="space-y-3 text-sm text-purple-900">
                <div className="flex items-start gap-3">
                  <span>✓</span>
                  <p>
                    Tu cuenta de <strong>Cupones Bonda</strong> ha sido activada
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span>✓</span>
                  <p>
                    Tenés acceso a <strong>+150 descuentos exclusivos</strong> en
                    marcas reconocidas
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span>✓</span>
                  <p>
                    Ya podés <strong>solicitar y usar tus cupones</strong> desde el
                    dashboard
                  </p>
                </div>
              </div>
            </div>

            {/* Próximos pasos */}
            <div className="space-y-4 mb-6">
              <h2 className="font-bold text-gray-900">Próximos pasos:</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border-2 border-purple-200 rounded-lg p-4">
                  <div className="text-3xl mb-2">📧</div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    Revisa tu email
                  </h3>
                  <p className="text-sm text-gray-600">
                    Te enviamos un comprobante de tu donación a{' '}
                    <strong>{user?.email}</strong>
                  </p>
                </div>
                <div className="border-2 border-purple-200 rounded-lg p-4">
                  <div className="text-3xl mb-2">🎟️</div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    Explorá tus cupones
                  </h3>
                  <p className="text-sm text-gray-600">
                    Accedé a tu dashboard para ver todos los descuentos disponibles
                  </p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/dashboard"
                className="flex-1 py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all text-center shadow-lg"
              >
                🎟️ Ver Mis Cupones
              </Link>
              <Link
                href="/"
                className="flex-1 py-4 px-6 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all text-center"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>

        {/* Mensaje de impacto */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="font-bold text-gray-900 mb-3">
            🌟 Tu impacto en números
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-2xl font-bold text-purple-600 mb-1">1</div>
              <div className="text-gray-600">ONG apoyada</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 mb-1">+150</div>
              <div className="text-gray-600">Cupones disponibles</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 mb-1">3x</div>
              <div className="text-gray-600">Impacto generado</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Gracias por ser parte del cambio hacia un mundo más sostenible y
            solidario
          </p>
        </div>

        {/* Compartir en redes */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-3">
            Compartí tu acción en redes sociales:
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                const text = encodeURIComponent(
                  '¡Acabo de donar en Triple Impacto y obtuve acceso a +150 cupones de descuento! 💚🌱 #TripleImpacto',
                );
                window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
              }}
              className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
            >
              Twitter
            </button>
            <button
              onClick={() => {
                const url = encodeURIComponent(window.location.origin);
                window.open(
                  `https://www.facebook.com/sharer/sharer.php?u=${url}`,
                  '_blank',
                );
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
