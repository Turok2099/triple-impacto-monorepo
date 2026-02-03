'use client';

import { useEffect } from 'react';
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Redirigiendo al pago seguro...
        </h2>

        <p className="text-gray-600 mb-6">
          Estás siendo redirigido a Fiserv Connect para completar tu donación de
          forma segura.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
          <h3 className="font-medium text-blue-900 mb-2">¿Qué pasará ahora?</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span>1️⃣</span>
              <span>Serás redirigido a la página segura de Fiserv</span>
            </li>
            <li className="flex items-start gap-2">
              <span>2️⃣</span>
              <span>Ingresarás los datos de tu tarjeta</span>
            </li>
            <li className="flex items-start gap-2">
              <span>3️⃣</span>
              <span>Volverás a nuestro sitio con la confirmación</span>
            </li>
          </ul>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          <p>🔒 Pago procesado de forma segura por Fiserv</p>
          <p className="mt-1">
            Si no eres redirigido automáticamente,{' '}
            <button
              onClick={() => enviarFormularioFiserv(gatewayUrl, formParams)}
              className="text-purple-600 hover:text-purple-700 font-medium underline"
            >
              haz clic aquí
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
