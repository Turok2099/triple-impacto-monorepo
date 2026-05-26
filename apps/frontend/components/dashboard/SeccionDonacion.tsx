import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { crearTransaccion, obtenerURLsRetorno } from "@/lib/payments";
import FormularioDonacion from "@/components/donar/FormularioDonacion";
import FormularioPagoFiserv from "@/components/donar/FormularioPagoFiserv";
import PaymentFormRest from "@/components/donar/PaymentFormRest";
import { CreditCard, Globe, ArrowLeft } from "lucide-react";

export default function SeccionDonacion() {
  const { user, handleSessionExpired } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para el método elegido (rest o connect)
  const [paymentMethod, setPaymentMethod] = useState<'rest' | 'connect' | null>(null);

  // Estado para guardar los datos de monto/org en caso de REST
  const [donationData, setDonationData] = useState<{
    monto: number;
    organizacionId?: string;
  } | null>(null);

  // Estado para Connect (redirige al portal Fiserv)
  const [transaccionCreada, setTransaccionCreada] = useState<{
    gatewayUrl: string;
    formParams: Record<string, string>;
  } | null>(null);

  // Procesar Connect (se llama tras elegir monto/org si el método es connect)
  const procesarConnect = async (monto: number, organizacionId?: string) => {
    const token = localStorage.getItem("auth_token");
    if (!token || !user) {
      setError("Debes iniciar sesión para donar");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { successURL, errorURL } = obtenerURLsRetorno();

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

      setTransaccionCreada({
        gatewayUrl: response.gatewayUrl,
        formParams: response.formParams,
      });
    } catch (err: any) {
      console.error("Error al crear transacción:", err);
      if (err.message === "Unauthorized" || err.message.includes("401")) {
        handleSessionExpired();
        return;
      }
      setError(err.message || "Error al procesar la donación. Por favor, intenta nuevamente.");
      setLoading(false);
    }
  };

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
    <div className="py-6 w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Hacé tu Donación</h2>
        <p className="text-gray-600">
          Tu aporte genera triple impacto: ayudás a una ONG, cuidás el planeta y obtenés beneficios exclusivos
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-slate-100 p-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-red-500 text-xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-medium text-red-900 mb-1">Error</h3>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Flujo 1: Selección de Método de Pago */}
        {!paymentMethod && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-slate-800">¿Cómo preferís pagar?</h3>
              <p className="text-slate-500 mt-2">Seleccioná tu método de pago preferido para comenzar</p>
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
                  <p className="text-sm text-slate-500">Proceso rápido y nativo directamente en nuestra plataforma.</p>
                </div>
                <div className="mt-auto pt-4 flex items-center justify-between w-full">
                  <span className="text-indigo-600 font-semibold text-sm">Seleccionar</span>
                  <ArrowLeft className="w-4 h-4 text-indigo-600 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>

              {/* Opción Connect */}
              <button
                onClick={() => setPaymentMethod('connect')}
                className="group relative bg-white border-2 border-slate-200 hover:border-teal-500 rounded-2xl p-6 text-left transition-all hover:shadow-xl hover:shadow-teal-100 flex flex-col items-start gap-4"
              >
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-800 mb-1">Portal Seguro Fiserv</h4>
                  <p className="text-sm text-slate-500">Serás redirigido al portal oficial de Fiserv Connect para máxima seguridad.</p>
                </div>
                <div className="mt-auto pt-4 flex items-center justify-between w-full">
                  <span className="text-teal-600 font-semibold text-sm">Seleccionar</span>
                  <ArrowLeft className="w-4 h-4 text-teal-600 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Flujo 2: Connect (Monto + Org) */}
        {paymentMethod === 'connect' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
              onClick={() => setPaymentMethod(null)}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Cambiar método de pago
            </button>
            <FormularioDonacion onSubmit={procesarConnect} loading={loading} />
          </div>
        )}

        {/* Flujo 3: REST Step 1 (Monto + Org) */}
        {paymentMethod === 'rest' && !donationData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
              onClick={() => setPaymentMethod(null)}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Cambiar método de pago
            </button>
            <FormularioDonacion onSubmit={(monto, orgId) => setDonationData({ monto, organizacionId: orgId })} loading={loading} />
          </div>
        )}

        {/* Flujo 4: REST Step 2 (Tarjeta) */}
        {paymentMethod === 'rest' && donationData && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <button
              onClick={() => setDonationData(null)}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Cambiar monto
            </button>
            <PaymentFormRest
              initialAmount={donationData.monto}
              organizacionId={donationData.organizacionId}
              onSuccess={(data) => console.log('Éxito REST', data)}
              onError={(err) => setError('Error en pago REST: ' + (err.message || 'Desconocido'))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
