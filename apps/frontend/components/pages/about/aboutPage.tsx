"use client";

import {
  Target,
  Sparkles,
  Gem,
  Eye,
  ShieldCheck,
  Users,
  Lightbulb,
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
      {/* Header Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            La Comunidad AYNI
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
            <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-100 hover:border-teal-200 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
                  <Target className="w-6 h-6 text-teal-600" strokeWidth={2} />
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
            <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-100 hover:border-teal-200 transition-colors">
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
                  className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-gray-100 hover:border-teal-300"
                >
                  <div className="w-14 h-14 bg-teal-50 rounded-xl flex items-center justify-center mb-4">
                    <IconComponent
                      className="w-7 h-7 text-teal-600"
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

    </div>
  );
}
