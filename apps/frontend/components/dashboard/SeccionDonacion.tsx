import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { crearTransaccion, obtenerURLsRetorno } from "@/lib/payments";
import FormularioDonacion from "@/components/donar/FormularioDonacion";
import FormularioPagoFiserv from "@/components/donar/FormularioPagoFiserv";

export default function SeccionDonacion() {
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
    <div className="py-6 w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Hacé tu Donación</h2>
        <p className="text-gray-600">
          Tu aporte genera triple impacto: ayudás a una ONG, cuidás el planeta y obtenés beneficios exclusivos
        </p>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-3xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-slate-100 p-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-red-500 text-xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-medium text-red-900 mb-1">Error al procesar</h3>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <FormularioDonacion onSubmit={handleDonar} loading={loading} />
      </div>
    </div>
  );
}
