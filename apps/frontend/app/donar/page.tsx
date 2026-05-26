"use client";

import PaymentFormRest from "@/components/donar/PaymentFormRest";

export default function DonarPage() {
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
          <PaymentFormRest
            onSuccess={(data) => console.log('Éxito REST', data)}
          />
        </div>
      </div>
    </div>
  );
}
