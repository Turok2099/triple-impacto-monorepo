"use client";

import { Heart, Gift, RefreshCw, ArrowRight } from "lucide-react";

export default function AboutPage() {
  const steps = [
    {
      icon: Heart,
      title: "Paso 1",
      description: "Doná a causas socioambientales que te importen.",
    },
    {
      icon: Gift,
      title: "Paso 2",
      description: "Recibí beneficios tangibles a cambio.",
    },
    {
      icon: RefreshCw,
      title: "Paso 3",
      description: "Creá un ciclo de reciprocidad que hace que el impacto sea sostenible y escalable.",
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Purpose Section - Hero */}
        <section className="max-w-5xl mx-auto mb-20 mt-8 relative">
          <div className="absolute inset-0 bg-linear-to-r from-teal-50 to-teal-100 transform -skew-y-2 rounded-3xl -z-10"></div>
          <div className="bg-white/80 backdrop-blur-md border border-teal-100 rounded-3xl p-10 md:p-14 shadow-[0_8px_30px_rgb(64,168,171,0.1)]">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
                Nuestro <span className="text-transparent bg-clip-text bg-linear-to-r from-teal-500 to-teal-700">Propósito</span>
              </h1>
              <div className="w-16 h-1.5 bg-[#2c8184] mx-auto rounded-full"></div>
            </div>
            <p className="text-lg md:text-2xl text-gray-700 leading-relaxed text-center font-medium">
              <strong className="text-teal-700 font-bold">AYNI</strong> es una plataforma que promueve la reciprocidad y el apoyo mutuo, inspirada en el concepto ancestral andino de &quot;ayni&quot;, que significa &quot;reciprocidad&quot; o &quot;intercambio mutuo&quot;. La plataforma conecta a personas con ONGs y causas socioambientales, permitiendo donaciones, voluntariado digital y acceso a descuentos exclusivos, con el objetivo de crear una comunidad que genere un impacto positivo en la sociedad y el ambiente, promoviendo la solidaridad, la empatía y la reciprocidad.
            </p>
          </div>
        </section>

        {/* Vision / El bien que vuelve Section Redesign */}
        <section className="mb-28 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-12">
            El bien que <span className="text-[#2c8184]">vuelve</span>
          </h2>
          
          <div className="flex justify-center mb-12 text-[#2c8184]">
            <RefreshCw className="w-32 h-32 opacity-80 animate-[spin_12s_linear_infinite]" strokeWidth={1} />
          </div>

          <div className="space-y-6 text-xl text-gray-700 leading-relaxed bg-white p-8 md:p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_40px_rgb(64,168,171,0.1)] transition-all duration-300">
            <p>
              Imaginate un mundo donde cada acción cuenta, donde el bien que hacés a otros regresa de manera multiplicada.
            </p>
            <p>
              En AYNI, creemos en la filosofía ancestral andina de <strong className="text-teal-700 font-bold">&quot;Ayni&quot;</strong>, que significa &quot;el bien que vuelve&quot;.
            </p>
            <p className="font-medium text-gray-900">
              Nuestra plataforma <span className="text-[#2c8184] font-bold">Fintech de Reciprocidad</span> combina tecnología y propósito para revolucionar la forma en que las personas y empresas generan impacto socioambiental.
            </p>
          </div>
        </section>

        {/* How it works Section */}
        <section className="relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">¿Cómo funciona?</h2>
            <div className="w-24 h-1.5 bg-[#2c8184] mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto relative z-10">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div 
                  key={index} 
                  className="bg-white rounded-3xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_40px_rgb(64,168,171,0.15)] hover:border-teal-200 transition-all duration-300 transform md:hover:-translate-y-2 flex flex-col items-center text-center group"
                >
                  <div className="w-20 h-20 bg-teal-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-teal-100 transition-all duration-300">
                    <IconComponent className="w-10 h-10 text-[#2c8184]" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-sm font-semibold text-[#2c8184] uppercase tracking-widest mb-4">
                    {step.title}
                  </h3>
                  <p className="text-xl text-gray-800 leading-relaxed font-medium">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="mt-28 text-center pb-10">
          <a
            href="/ongs"
            className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-white transition-all bg-linear-to-r from-teal-600 to-teal-700 rounded-full hover:from-teal-500 hover:to-teal-600 hover:shadow-[0_8px_25px_rgb(64,168,171,0.4)] hover:-translate-y-1"
          >
            Empezá a donar hoy
            <ArrowRight className="w-6 h-6 ml-3" />
          </a>
        </section>

      </div>
    </div>
  );
}
