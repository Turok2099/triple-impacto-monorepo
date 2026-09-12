"use client";

import { Zap, ShieldCheck, Unlock } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-[#2c8184] via-teal-600 to-teal-800 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-700 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-700 rounded-full filter blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Badge */}

        {/* Título Principal */}
        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
          Viví el Bienestar Circular: transformá tu aporte en {" "}
          <span className="inline-block bg-black/20 backdrop-blur-sm px-4 py-2 rounded-2xl mt-2">
            impacto y beneficios
          </span>
        </h2>

        {/* Subtítulo */}
        <p className="text-xl text-teal-50 mb-10 leading-relaxed max-w-2xl mx-auto">
          Cada aporte transforma vidas y te recompensa. Sumate hoy, cambiá el futuro. 
          <span className="block mt-2 font-semibold">
            Todo lo que das, vuelve multiplicado.
          </span>
        </p>

        {/* Propuesta de valor rápida */}
        <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-white">
          <div className="flex flex-col items-center gap-2 bg-black/20 backdrop-blur-sm px-5 py-5 rounded-2xl">
            <Zap className="w-7 h-7" strokeWidth={2} />
            <span className="font-bold">Impacto inmediato</span>
            <span className="text-sm text-teal-50">Descuentos al instante</span>
          </div>
          <div className="flex flex-col items-center gap-2 bg-black/20 backdrop-blur-sm px-5 py-5 rounded-2xl">
            <ShieldCheck className="w-7 h-7" strokeWidth={2} />
            <span className="font-bold">100% transparente</span>
            <span className="text-sm text-teal-50">Sin comisiones ocultas</span>
          </div>
          <div className="flex flex-col items-center gap-2 bg-black/20 backdrop-blur-sm px-5 py-5 rounded-2xl">
            <Unlock className="w-7 h-7" strokeWidth={2} />
            <span className="font-bold">Cancelá cuando quieras</span>
            <span className="text-sm text-teal-50">Seguro y confiable</span>
          </div>
        </div>
      </div>
    </section>
  );
}
