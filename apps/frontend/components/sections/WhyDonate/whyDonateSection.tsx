"use client";

import { useRef, useEffect, useState } from "react";
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
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Gift,
  XCircle,
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
    value: "+ 15.000",
    label: "Personas beneficiadas",
  },
];

// Testimonios (los 5 integrados)
const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Valentina Clutterbuck",
    role: "Resp. de Sostenibilidad - CORIPA",
    avatar: "🏢",
    text: "En Coripa, creemos firmemente que cuando el propósito social y el bienestar del equipo se alinean, el impacto positivo es imparable. Por eso transformamos un compromiso social en un beneficio tangible para nuestra gente.\n\nLogramos un modelo win win: continuamos impulsando la transformación social de Proyectar ONG (impacto social) y al mismo tiempo ese aporte se traduce en una amplia red de beneficios para nuestros colaboradores (Bienestar Interno).\n\n¿El resultado? Lo que invertimos en la comunidad vuelve a casa, potenciando la motivación bajo el modelo de Triple Impacto.",
    rating: 5,
  },
  {
    id: 2,
    name: "Marina Sanchi",
    role: "Resp. de Capital Humano - CORIPA",
    avatar: "🏢",
    text: "Decidimos 'buscarle la vuelta' a nuestros recursos para que tengan un doble propósito: apoyar la valiosa labor de Proyectar ONG y cuidar el bienestar del Equipo. Así ofrecemos descuentos en beneficios clave que nutren su crecimiento.\n\nEsta alianza nos entusiasma porque nos invita a acompañar a cada integrante en su inclusión tecnológica. ¡Porque cuando crecemos con impacto social, el beneficio es de todos!",
    rating: 5,
  },
  {
    id: 3,
    name: "Lara Blanco",
    role: "Coord. de Fidelización",
    avatar: "👩",
    text: "Con Club Triple Impacto logramos aumentar la permanencia de socios, reduciendo también las bajas. Vamos a seguir integrando esta herramienta en nuestras acciones de comunicación para fortalecer el vínculo con nuestra comunidad.",
    rating: 5,
  },
  {
    id: 4,
    name: "Micaela Romano",
    role: "Analista de Marketing",
    avatar: "👩",
    text: "Desde el inicio me pareció un beneficio que genera un verdadero círculo virtuoso: impulsa las economías locales, acompaña a una ONG, ofrece valor directo a quienes la utilizamos y permite a las empresas brindar a sus colaboradores un beneficio que hace más eficiente su presupuesto. Gracias a AYNI por trabajar en la mejora continua.",
    rating: 5,
  },
  {
    id: 5,
    name: "Carolina Casares",
    role: "Directora Ejecutiva - Proyectar ONG",
    avatar: "https://res.cloudinary.com/dxbtafe9u/image/upload/v1772639410/PROYECTARR_fkylyp.jpg",
    text: "El verdadero triple impacto ocurre cuando el propósito se vuelve acción compartida y crecemos juntos, en este caso Proyectar ONG, CORIPA y sus colaboradores",
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
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-play logic
  useEffect(() => {
    if (isHovered) return;

    const intervalId = setInterval(() => {
      if (carouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        // Si llegamos al final, volvemos al principio suavemente
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          carouselRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          // Sino, pasamos a la siguiente tarjeta (aproximadamente el ancho de una tarjeta)
          const scrollAmount = clientWidth > 768 ? clientWidth / 3 : clientWidth;
          carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
      }
    }, 4500);

    return () => clearInterval(intervalId);
  }, [isHovered]);

  const scrollLeft = () => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.clientWidth > 768 ? carouselRef.current.clientWidth / 3 : carouselRef.current.clientWidth;
      carouselRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.clientWidth > 768 ? carouselRef.current.clientWidth / 3 : carouselRef.current.clientWidth;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

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

        {/* Ventajas & Impacto */}
        <div className="mx-auto max-w-6xl px-4 py-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Personas Beneficiadas (Stat principal) */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:border-teal-300 hover:shadow-xl transition-all text-center flex flex-col items-center justify-center">
              <Users className="w-12 h-12 text-[#40a8ab] mb-4" strokeWidth={1.5} />
              <div className="font-bold text-4xl text-[#40a8ab] mb-2">+ 15.000</div>
              <p className="font-bold text-sm tracking-wide uppercase text-gray-800">Personas beneficiadas</p>
            </div>

            {/* Transparencia */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:border-teal-300 hover:shadow-xl transition-all text-center flex flex-col items-center justify-center">
              <ShieldCheck className="w-12 h-12 text-[#40a8ab] mb-4" strokeWidth={1.5} />
              <div className="font-bold text-xl text-gray-900 mb-2">Transparencia garantizada</div>
              <p className="text-sm text-gray-600">Cada donación es auditada, trazable y verificable.</p>
            </div>

            {/* Descuentos */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:border-teal-300 hover:shadow-xl transition-all text-center flex flex-col items-center justify-center">
              <Gift className="w-12 h-12 text-[#40a8ab] mb-4" strokeWidth={1.5} />
              <div className="font-bold text-xl text-gray-900 mb-2">Descuentos al instante</div>
              <p className="text-sm text-gray-600">Accedé a cientos de beneficios sumando impacto.</p>
            </div>

            {/* Cancelación */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:border-teal-300 hover:shadow-xl transition-all text-center flex flex-col items-center justify-center">
              <XCircle className="w-12 h-12 text-[#40a8ab] mb-4" strokeWidth={1.5} />
              <div className="font-bold text-xl text-gray-900 mb-2">Cancela cuando quieras</div>
              <p className="text-sm text-gray-600">Pausá o cancelá tu donación online y sin ataduras.</p>
            </div>

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

        {/* Testimonios Carrousel */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-3">
              Lo que dicen nuestros donantes
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Historias reales de personas que confían en nuestro modelo
            </p>
          </div>

          <div className="relative max-w-6xl mx-auto" 
               onMouseEnter={() => setIsHovered(true)}
               onMouseLeave={() => setIsHovered(false)}>
            
            {/* Controles del Carrusel */}
            <button 
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 p-3 bg-white border-2 border-gray-100 rounded-full shadow-lg text-[#40a8ab] hover:bg-teal-50 hover:scale-110 transition-all sm:-ml-6"
              aria-label="Testimonio anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button 
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 p-3 bg-white border-2 border-gray-100 rounded-full shadow-lg text-[#40a8ab] hover:bg-teal-50 hover:scale-110 transition-all sm:-mr-6"
              aria-label="Testimonio siguiente"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Contenedor scrolleable */}
            <div 
              ref={carouselRef}
              className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory scroll-smooth hide-scrollbar px-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className="snap-center min-w-[100%] md:min-w-[calc(33.3333%-1rem)] lg:min-w-[calc(33.3333%-1rem)] bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-teal-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  style={{
                    animation: `slideInUp 0.6s ease-out ${index * 0.15}s both`,
                  }}
                >
                  <div>
                    {/* Rating */}
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <span key={i} className="text-amber-400 text-xl">
                          ⭐
                        </span>
                      ))}
                    </div>

                    {/* Texto */}
                    <p className="text-gray-700 mb-6 leading-relaxed italic whitespace-pre-line text-sm">
                      "{testimonial.text}"
                    </p>
                  </div>

                  {/* Autor */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200 mt-auto">
                    <div className="w-12 h-12 bg-linear-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center overflow-hidden text-2xl shrink-0">
                      {testimonial.avatar.startsWith('http') ? (
                        <img src={testimonial.avatar} alt={testimonial.name} className="w-full h-full object-cover" />
                      ) : (
                        testimonial.avatar
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        {testimonial.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pequeña capa invisible para esconder barra de scroll webkit en CSS si no aplica lo de style */}
            <style jsx>{`
              .hide-scrollbar::-webkit-scrollbar {
                display: none;
              }
            `}</style>
          </div>
        </div>


      </div>
    </section>
  );
}
