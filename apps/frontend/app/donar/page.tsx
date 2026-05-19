"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { crearTransaccion, obtenerURLsRetorno } from "@/lib/payments";
import FormularioDonacion from "@/components/donar/FormularioDonacion";
import FormularioPagoFiserv from "@/components/donar/FormularioPagoFiserv";
import PaymentFormRest from "@/components/donar/PaymentFormRest";
import Link from "next/link";
import { CreditCard, Globe, ArrowLeft } from "lucide-react";

export default function DonarPage() {
  const { user, handleSessionExpired } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Nuevo estado para guardar los datos antes de elegir el método de pago
  const [donationData, setDonationData] = useState<{
    monto: number;
    organizacionId?: string;
  } | null>(null);

  // Estado para el método elegido
  const [paymentMethod, setPaymentMethod] = useState<'rest' | 'connect' | null>(null);

  const [transaccionCreada, setTransaccionCreada] = useState<{
    gatewayUrl: string;
    formParams: Record<string, string>;
  } | null>(null);

  // 1. Primer paso: Guardar monto y organización y mostrar selección
  const handleDonarInit = (monto: number, organizacionId?: string) => {
    // Obtener token de localStorage
    const token = localStorage.getItem("auth_token");

    if (!token || !user) {
      setError("Debes iniciar sesión para donar");
      return;
    }

    setDonationData({ monto, organizacionId });
    setError(null);
  };

  // 2. Segundo paso: El usuario elige Connect
  const procesarConnect = async () => {
    if (!donationData) return;

    const token = localStorage.getItem("auth_token");
    if (!token) return;

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
          amount: donationData.monto,
          currency: "ARS",
          organizacion_id: donationData.organizacionId,
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

          {/* Flujo: 1. Formulario Inicial */}
          {!donationData && (
            <FormularioDonacion onSubmit={handleDonarInit} loading={loading} />
          )}

          {/* Flujo: 2. Selección de Método de Pago */}
          {donationData && !paymentMethod && !transaccionCreada && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button
                onClick={() => setDonationData(null)}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Volver atrás
              </button>

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-800">¿Cómo preferís pagar?</h3>
                <p className="text-slate-500 mt-2">Seleccioná tu método de pago preferido para completar la donación de ${donationData.monto}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Opción REST API */}
                <button
                  onClick={() => setPaymentMethod('rest')}
                  className="group relative bg-white border-2 border-slate-200 hover:border-indigo-500 rounded-2xl p-6 text-left transition-all hover:shadow-xl hover:shadow-indigo-100 flex flex-col items-start gap-4"
                >
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CreditCard className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 mb-1">Pago Rápido</h4>
                    <p className="text-sm text-slate-500">Ingresá tu tarjeta directamente aquí sin salir de nuestra plataforma. Proceso rápido y nativo.</p>
                  </div>
                  <div className="mt-auto pt-4 flex items-center justify-between w-full">
                    <span className="text-indigo-600 font-semibold text-sm">Seleccionar</span>
                    <ArrowLeft className="w-4 h-4 text-indigo-600 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>

                {/* Opción Connect */}
                <button
                  onClick={() => procesarConnect()}
                  disabled={loading}
                  className="group relative bg-white border-2 border-slate-200 hover:border-teal-500 rounded-2xl p-6 text-left transition-all hover:shadow-xl hover:shadow-teal-100 flex flex-col items-start gap-4 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Globe className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 mb-1">Portal Seguro Fiserv</h4>
                    <p className="text-sm text-slate-500">Serás redirigido al portal oficial de Fiserv Connect para ingresar tus datos con máxima seguridad.</p>
                  </div>
                  <div className="mt-auto pt-4 flex items-center justify-between w-full">
                    <span className="text-teal-600 font-semibold text-sm">
                      {loading ? 'Procesando...' : 'Seleccionar'}
                    </span>
                    {!loading && <ArrowLeft className="w-4 h-4 text-teal-600 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Flujo: 3A. Formulario REST */}
          {paymentMethod === 'rest' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button
                onClick={() => setPaymentMethod(null)}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Volver a métodos de pago
              </button>
              {/* Le pasamos el monto para que el formulario lo tenga, más adelante lo adaptaremos para crear la transacción real */}
              <PaymentFormRest
                initialAmount={donationData?.monto}
                onSuccess={(data) => console.log('Éxito REST', data)}
                onError={(err) => setError('Error en pago REST: ' + (err.message || 'Desconocido'))}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


