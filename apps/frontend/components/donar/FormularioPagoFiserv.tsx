'use client';

import { useEffect } from 'react';
import { Lock } from 'lucide-react';
import { enviarFormularioFiserv } from '@/lib/payments';

interface FormularioPagoFiservProps {
  gatewayUrl: string;
  formParams: Record<string, string>;
  autoSubmit?: boolean;
}

/**
 * Componente que renderiza y auto-envía el formulario a Fiserv Connect
 * El usuario será redirigido automáticamente al gateway de pago
 */
export default function FormularioPagoFiserv({
  gatewayUrl,
  formParams,
  autoSubmit = true,
}: FormularioPagoFiservProps) {
  useEffect(() => {
    if (autoSubmit) {
      // Pequeño delay para que el usuario vea el mensaje de redirección
      const timer = setTimeout(() => {
        enviarFormularioFiserv(gatewayUrl, formParams);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [gatewayUrl, formParams, autoSubmit]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="flex flex-col items-center max-w-sm text-center">
        <div className="mb-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16a459] mx-auto"></div>
        </div>

        <h2 className="text-xl font-bold text-[#1A202C] mb-2">
          Conectando con Fiserv...
        </h2>

        <p className="text-sm text-slate-500 font-medium mb-12">
          Aguardá un instante mientras preparamos tu entorno de pago seguro.
        </p>

        <div className="text-xs text-slate-400 flex flex-col items-center gap-2">
          <p className="flex items-center gap-1.5 font-medium">
            <Lock className="w-4 h-4 text-slate-400" /> Pago 100% seguro interactuando con Fiserv Connect
          </p>
          <p>
            Si tu navegador bloquea la redirección,{' '}
            <button
              onClick={() => enviarFormularioFiserv(gatewayUrl, formParams)}
              className="text-[#16a459] hover:underline font-semibold"
            >
              continúa manualmente aquí
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
