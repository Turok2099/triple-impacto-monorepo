"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { crearTransaccion, obtenerURLsRetorno } from "@/lib/payments";
import FormularioDonacion from "@/components/donar/FormularioDonacion";
import FormularioPagoFiserv from "@/components/donar/FormularioPagoFiserv";
import Link from "next/link";

export default function DonarPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transaccionCreada, setTransaccionCreada] = useState<{
    gatewayUrl: string;
    formParams: Record<string, string>;
  } | null>(null);

  const handleDonar = async (monto: number, organizacionId?: string) => {
    // Obtener token de localStorage
    const token = localStorage.getItem("auth_token");

    if (!token || !user) {
      setError("Debes iniciar sesión para donar");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Obtener URLs de retorno
      const { successURL, errorURL } = obtenerURLsRetorno();

      // DEBUG: Ver URLs generadas
      console.log("📍 URLs de retorno:", {
        successURL,
        errorURL,
        origin: window.location.origin,
      });

      // Crear transacción en el backend
      const response = await crearTransaccion(
        {
          amount: monto,
          currency: "ARS",
          organizacion_id: organizacionId,
          responseSuccessURL: successURL,
          responseFailURL: errorURL,
        },
        token
      );

      // Guardar datos de la transacción para enviar el formulario
      setTransaccionCreada({
        gatewayUrl: response.gatewayUrl,
        formParams: response.formParams,
      });
    } catch (err: any) {
      console.error("Error al crear transacción:", err);
      setError(
        err.message ||
          "Error al procesar la donación. Por favor, intenta nuevamente."
      );
      setLoading(false);
    }
  };

  // Si la transacción fue creada, mostrar el formulario de Fiserv
  if (transaccionCreada) {
    return (
      <FormularioPagoFiserv
        gatewayUrl={transaccionCreada.gatewayUrl}
        formParams={transaccionCreada.formParams}
        autoSubmit={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
          >
            ← Volver al inicio
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Hacé tu Donación
          </h1>
          <p className="text-lg text-gray-600">
            Tu aporte genera triple impacto: ayudás a una ONG, cuidás el planeta
            y obtenés beneficios exclusivos
          </p>
        </div>

        {/* Banner de beneficios */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-4">🎁 Beneficios al donar</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl">💚</span>
              <div>
                <h3 className="font-bold mb-1">Ayudás a una causa</h3>
                <p className="text-sm text-purple-100">
                  Tu donación apoya el trabajo de organizaciones sociales
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-3xl">🌱</span>
              <div>
                <h3 className="font-bold mb-1">Impacto ambiental</h3>
                <p className="text-sm text-purple-100">
                  Contribuís a proyectos de sostenibilidad
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-3xl">🎟️</span>
              <div>
                <h3 className="font-bold mb-1">Cupones Bonda</h3>
                <p className="text-sm text-purple-100">
                  Acceso a descuentos en +150 marcas reconocidas
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario de donación */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-red-500 text-xl">⚠️</span>
                <div className="flex-1">
                  <h3 className="font-medium text-red-900 mb-1">
                    Error al procesar la donación
                  </h3>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <FormularioDonacion onSubmit={handleDonar} loading={loading} />
        </div>

        {/* Información adicional */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-2xl">🔒</span>
              Pago 100% seguro
            </h3>
            <p className="text-sm text-gray-600">
              Tu pago es procesado de forma segura por Fiserv Connect,
              cumpliendo con los más altos estándares de seguridad PCI DSS.
              Nunca almacenamos datos de tu tarjeta.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-2xl">📧</span>
              Recibo por email
            </h3>
            <p className="text-sm text-gray-600">
              Recibirás un comprobante de tu donación por email. Podés solicitar
              un certificado de donación para deducción de impuestos desde tu
              dashboard.
            </p>
          </div>
        </div>

        {/* FAQ rápido */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="font-bold text-gray-900 mb-4">Preguntas frecuentes</h3>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">
                ¿Cuándo tendré acceso a los cupones?
              </h4>
              <p className="text-gray-600">
                Inmediatamente después de confirmar tu donación, tendrás acceso
                a tu dashboard con todos los cupones disponibles.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">
                ¿Puedo cancelar mi donación?
              </h4>
              <p className="text-gray-600">
                Las donaciones son procesadas inmediatamente. Si tenés algún
                problema, contactanos a soporte@tripleimpacto.site
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">
                ¿Qué métodos de pago aceptan?
              </h4>
              <p className="text-gray-600">
                Aceptamos todas las tarjetas de crédito y débito (Visa,
                Mastercard, American Express, Cabal) procesadas por Fiserv.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
