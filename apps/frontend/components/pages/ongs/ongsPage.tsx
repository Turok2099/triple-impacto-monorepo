"use client";

import Link from "next/link";
import PartnersSection from "@/components/sections/Partners/partnersSection";

export default function ONGsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto mt-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
            Nuestras ONGs Aliadas
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Trabajamos exclusivamente con organizaciones comprobadas y autorizadas
            para recibir aportes a través de nuestra red de impacto social.
          </p>
        </div>

        {/* Reusing the exact Home Page component */}
        <div className="-mx-4 sm:-mx-6 lg:-mx-8">
          <PartnersSection hideHeader hideCTA className="bg-transparent py-0" />
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center bg-linear-to-br from-teal-500 to-teal-700 rounded-[2rem] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden">
          {/* Decorative background circle */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-teal-400 opacity-20 blur-3xl"></div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4 relative z-10 text-white">
            Transformá con nosotos
          </h2>
          <p className="text-teal-50 text-lg mb-8 max-w-2xl mx-auto relative z-10">
            Tu apoyo marca la diferencia. Todas las organizaciones de nuestra red
            han sido verificadas y garantizan un impacto real.
          </p>
          <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/donar"
              className="inline-flex items-center justify-center px-8 py-4 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl shadow-lg hover:scroll-m-0 hover:scale-105 transition-all text-lg"
            >
              Quiero donar ahora
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
