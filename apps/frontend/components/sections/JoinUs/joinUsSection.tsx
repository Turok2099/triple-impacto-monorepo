"use client";

import { Building2, HeartHandshake, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function JoinUsSection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Sé parte del ecosistema AYNI
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Buscamos potenciar el impacto. Ya sea que representes a una organización o a una empresa, tenemos un espacio para vos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Card ONGs */}
          <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:border-teal-200 hover:shadow-lg transition-all duration-300 group">
            <div className="w-14 h-14 bg-teal-100/50 rounded-2xl flex items-center justify-center mb-6 text-[#40a8ab] group-hover:scale-110 group-hover:bg-teal-100 transition-transform">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Sumá tu ONG</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Multiplicá el alcance de tu organización. Recibí donaciones recurrentes y formá parte de nuestra red de impacto validado.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center text-[#40a8ab] font-semibold hover:text-[#2c8184] transition-colors"
            >
              Registrar mi ONG
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Card Empresas */}
          <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 group">
            <div className="w-14 h-14 bg-blue-100/50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 group-hover:bg-blue-100 transition-transform">
              <Building2 className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">AYNI para Empresas</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Fidelizá a tus colaboradores con beneficios únicos que generan un triple impacto. Potenciá la Responsabilidad Social de tu corporación.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              Alianza Corporativa
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
