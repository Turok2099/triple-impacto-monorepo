"use client";

import {
  Users,
  Target,
  CircleDollarSign,
  Handshake,
  GraduationCap,
  Utensils,
  Sprout,
  Home,
  Heart,
  TrendingUp,
} from "lucide-react";

// Tipos
interface ImpactStat {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  value: string;
  label: string;
}

interface Testimonial {
  id: number;
  name: string;
  role: string;
  avatar: string;
  text: string;
  rating: number;
}

// Estadísticas de impacto
const impactStats = [
  {
    icon: Users,
    value: "+1,200",
    label: "Personas beneficiadas",
  },
  {
    icon: Target,
    value: "+10",
    label: "Proyectos activos",
  },
  {
    icon: CircleDollarSign,
    value: "$2.5M",
    label: "Donaciones gestionadas",
  },
  {
    icon: Handshake,
    value: "16",
    label: "ONGs aliadas",
  },
];

// Testimonios
const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Lara BLanco",
    role: "Coord. de Fidelización",
    avatar: "👩",
    text: "Con Club Triple Impacto logramos aumentar la permanencia de socios, reduciendo también las bajas. Vamos a seguir integrando esta herramienta en nuestras acciones de comunicación para fortalecer el vínculo con nuestra comunidad.",
    rating: 5,
  },
  {
    id: 2,
    name: "MIcaela Romano",
    role: "Analista de Marketing",
    avatar: "👩",
    text: "Desde el inicio me pareció un beneficio que genera un verdadero círculo virtuoso: impulsa las economías locales, acompaña a una ONG, ofrece valor directo a quienes la utilizamos y permite a las empresas brindar a sus colaboradores un beneficio que hace más eficiente su presupuesto.Gracias a Coripa por trabajar en la mejora continua, buscando generar impacto positivo para la empresa y sus colaboradores.",
    rating: 5,
  },
  {
    id: 3,
    name: "Laura Fernández",
    role: "Beneficiaria - Fundación Tzedaká",
    avatar: "👩‍🎓",
    text: "Gracias a las donaciones pude terminar mis estudios. Hoy soy profesional y puedo ayudar a mi familia. Eternamente agradecida.",
    rating: 5,
  },
];

// Áreas de impacto (basadas en las ONGs de partners.ts)
const impactAreas = [
  {
    icon: GraduationCap,
    title: "Educación",
    count: "8",
    description: "ONGs",
  },
  {
    icon: Utensils,
    title: "Alimentación",
    count: "2",
    description: "ONGs",
  },
  {
    icon: Sprout,
    title: "Medio Ambiente",
    count: "4",
    description: "ONGs",
  },
  {
    icon: Home,
    title: "Vivienda",
    count: "1",
    description: "ONGs",
  },
  {
    icon: Heart,
    title: "Familia e Infancia",
    count: "5",
    description: "ONGs",
  },
  {
    icon: TrendingUp,
    title: "Inclusión Social",
    count: "2",
    description: "ONGs",
  },
];

export default function WhyDonateSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            ¿Por qué donar con AYNI?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Somos el puente entre tu generosidad y el cambio real. Cada donación
            es 100% trazable y genera impacto verificable.
          </p>
        </div>

        {/* Estadísticas de Impacto */}
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:px-24 md:py-16 lg:px-8 lg:py-20 mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {impactStats.map((stat, index) => {
              const IconComponent = stat.icon;
              const isLast = index === impactStats.length - 1;

              return (
                <div
                  key={index}
                  className={`mb-12 text-center md:mb-0 ${!isLast ? "md:border-r-2 md:border-gray-200" : ""
                    }`}
                >
                  {/* Icono */}
                  <div className="flex justify-center mb-4">
                    <IconComponent
                      className="w-12 h-12 text-[#40a8ab]"
                      strokeWidth={1.5}
                    />
                  </div>

                  {/* Valor */}
                  <div className="font-bold text-[2.6rem] lg:text-5xl xl:text-6xl text-[#40a8ab] mb-2">
                    {stat.value}
                  </div>

                  {/* Label */}
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-800 lg:text-sm px-2">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Áreas de Impacto (ODS) */}
        <div className="mb-20">
          <div className="text-center mb-12 px-4">
            <p className="text-xl md:text-2xl font-medium text-gray-800 max-w-4xl mx-auto leading-relaxed">
              AYNI aborda los 17 ODS, generando beneficios económicos, sociales y ambientales, y promoviendo la sostenibilidad y el desarrollo equitativo.
            </p>
          </div>

          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 flex justify-center">
            <div className="relative w-full aspect-[16/9] md:aspect-[2/1] rounded-3xl overflow-hidden shadow-lg border-2 border-slate-100 bg-white hover:border-teal-200 transition-colors duration-300">
              <img
                src="/17ODS.png"
                alt="17 Objetivos de Desarrollo Sostenible"
                className="w-full h-full object-contain p-4 md:p-8"
              />
            </div>
          </div>
        </div>

        {/* Testimonios */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-3">
              Lo que dicen nuestros donantes
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Historias reales de personas que confían en nuestro modelo
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-teal-400 hover:shadow-xl transition-all duration-300"
                style={{
                  animation: `slideInUp 0.6s ease-out ${index * 0.15}s both`,
                }}
              >
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-amber-400 text-xl">
                      ⭐
                    </span>
                  ))}
                </div>

                {/* Texto */}
                <p className="text-gray-700 mb-6 leading-relaxed italic">
                  "{testimonial.text}"
                </p>

                {/* Autor */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <div className="w-12 h-12 bg-linear-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sello de Confianza */}
        <div className="rounded-3xl p-8 lg:p-12 text-white text-center bg-linear-to-r from-teal-600 to-teal-700">
          <div className="max-w-3xl mx-auto">
            <div className="text-6xl mb-4">🛡️</div>
            <h3 className="text-3xl font-bold mb-4">
              Transparencia garantizada
            </h3>
            <p className="text-white/90 text-lg mb-6">
              Cada donación es auditada, trazable y verificable.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                <span>✓</span>
                <span>Auditorías independientes</span>
              </div>

              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                <span>✓</span>
                <span>100% trazabilidad</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                <span>✓</span>
                <span>Datos verificables</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
