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
        
        {/* Intro Section */}
        <section className="text-center max-w-4xl mx-auto mb-28 mt-8">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-gray-900 mb-8 leading-tight tracking-tight">
            El bien que <span className="text-transparent bg-clip-text bg-linear-to-r from-teal-500 to-teal-700">vuelve</span>
          </h1>
          <div className="space-y-6 text-xl sm:text-2xl text-gray-600 leading-relaxed font-light">
            <p>
              Imaginate un mundo donde cada acción cuenta, donde el bien que hacés a otros regresa de manera multiplicada.
            </p>
            <p>
              En AYNI, creemos en la filosofía ancestral andina de <strong className="text-teal-700 font-bold">"Ayni"</strong>, que significa "el bien que vuelve".
            </p>
            <p>
              Nuestra plataforma <strong className="text-teal-700 font-bold">Fintech de Reciprocidad</strong> combina tecnología y propósito para revolucionar la forma en que las personas y empresas generan impacto socioambiental.
            </p>
          </div>
        </section>

        {/* How it works Section */}
        <section className="relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">¿Cómo funciona?</h2>
            <div className="w-24 h-1.5 bg-teal-500 mx-auto rounded-full"></div>
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
                    <IconComponent className="w-10 h-10 text-teal-600" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-sm font-semibold text-teal-600 uppercase tracking-widest mb-4">
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
