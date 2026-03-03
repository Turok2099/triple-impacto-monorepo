"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { crearTransaccion, obtenerURLsRetorno } from "@/lib/payments";
import FormularioDonacion from "@/components/donar/FormularioDonacion";
import FormularioPagoFiserv from "@/components/donar/FormularioPagoFiserv";
import Link from "next/link";

export default function DonarPage() {
  const { user, handleSessionExpired } = useAuth();
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

      // Si es un error 401 (token expirado), redirigir al login
      if (err.message === "Unauthorized" || err.message.includes("401")) {
        handleSessionExpired();
        return;
      }

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
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Hacé tu Donación
          </h1>
          <p className="text-lg text-gray-600">
            Tu aporte genera triple impacto: ayudás a una ONG, cuidás el planeta
            y obtenés beneficios exclusivos
          </p>
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
      </div>
    </div>
  );
}
