"use client";

import {
  Target,
  Sparkles,
  Gem,
  Eye,
  ShieldCheck,
  Users,
  Lightbulb,
  ArrowLeft,
  Heart,
} from "lucide-react";

export default function AboutPage() {
  const values = [
    {
      icon: Eye,
      title: "Transparencia",
      description:
        "Cada peso es trazable. Reportamos el impacto de cada donación.",
    },
    {
      icon: ShieldCheck,
      title: "Verificación",
      description: "Todas nuestras ONGs están auditadas y certificadas.",
    },
    {
      icon: Users,
      title: "Colaboración",
      description: "Creamos redes de apoyo mutuo entre todos los actores.",
    },
    {
      icon: Lightbulb,
      title: "Innovación",
      description: "Reinventamos la manera de generar impacto social.",
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      {/* Botón volver */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver al inicio</span>
        </a>
      </div>

      {/* Header Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-6">
            <Heart className="w-8 h-8 text-emerald-600" strokeWidth={2} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            La Comunidad Club Triple Impacto
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Un espacio de encuentro donde la colaboración transforma la
            solidaridad en un movimiento colectivo de cambio real
          </p>
        </div>
      </section>

      {/* Misión y Visión - Grid de 2 columnas */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Misión */}
            <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-100 hover:border-emerald-200 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                  <Target className="w-6 h-6 text-emerald-600" strokeWidth={2} />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Nuestra Misión
                </h2>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600 leading-relaxed">
                  Nacemos con la misión de generar un impacto positivo en la
                  sociedad y en el ambiente a través de la unión y colaboración
                  entre ciudadanos, gobiernos, empresas, ONGs y emprendedores.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Construimos un espacio de encuentro donde personas y
                  organizaciones comprometidas con el triple impacto —social,
                  ambiental y económico— pueden compartir experiencias, recursos
                  y conocimientos para impulsar proyectos que mejoren la vida de
                  las personas y del planeta.
                </p>
              </div>
            </div>

            {/* Visión */}
            <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-100 hover:border-emerald-200 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-blue-600" strokeWidth={2} />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Nuestra Visión
                </h2>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600 leading-relaxed">
                  Consolidarnos como una comunidad líder en sostenibilidad,
                  reconocida por inspirar y demostrar que, cuando trabajamos
                  juntos con transparencia, innovación y colaboración, es posible
                  transformar la solidaridad en un movimiento colectivo capaz de
                  generar un cambio real y duradero.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Formamos parte de un movimiento global de impacto positivo,
                  donde la economía circular hace real la visión de un mundo
                  mejor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Valores Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-6">
              <Gem className="w-8 h-8 text-purple-600" strokeWidth={2} />
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Nuestros Valores
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Los pilares que guían nuestra comunidad hacia el impacto positivo
            </p>
          </div>

          {/* Grid de Valores */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-gray-100 hover:border-emerald-300"
                >
                  <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                    <IconComponent
                      className="w-7 h-7 text-emerald-600"
                      strokeWidth={2}
                    />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-emerald-600 via-blue-600 to-purple-700 relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Sé parte del cambio
          </h2>
          <p className="text-xl text-emerald-50 mb-10 leading-relaxed max-w-2xl mx-auto">
            Te invitamos a unirte a esta comunidad que forma parte de un
            movimiento global de impacto positivo. Con tu adhesión, no solo
            obtienes beneficios, sino que también participas en la construcción
            de un ecosistema donde la economía circular hace real la visión de un
            mundo mejor.
          </p>
          <a
            href="/"
            className="inline-block px-8 py-4 bg-white text-emerald-600 font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
          >
            Unirme a la comunidad
          </a>
        </div>
      </section>
    </div>
  );
}
