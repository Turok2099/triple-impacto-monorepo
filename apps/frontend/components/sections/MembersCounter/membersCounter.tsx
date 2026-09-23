"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Users, Heart, Sparkles } from "lucide-react";

const AVATAR_GRADIENTS = [
  "from-teal-400 to-teal-600",
  "from-amber-400 to-orange-500",
  "from-sky-400 to-blue-500",
  "from-rose-400 to-pink-500",
  "from-violet-400 to-purple-500",
];

export default function MembersCounter() {
  const [contadorSocios, setContadorSocios] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Detectar cuando la sección entra en pantalla
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [isVisible]);

  // Animación del contador de socios (solo cuando es visible)
  useEffect(() => {
    if (!isVisible) return;

    let inicio = 0;
    const fin = 17000;
    const duracion = 2000;
    const incremento = fin / (duracion / 16);

    const timer = setInterval(() => {
      inicio += incremento;
      if (inicio >= fin) {
        setContadorSocios(fin);
        clearInterval(timer);
      } else {
        setContadorSocios(Math.floor(inicio));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isVisible]);

  return (
    <section ref={sectionRef} className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        {/* Pill superior */}
        <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-500 px-4 py-2 rounded-full text-sm font-bold mb-6">
          <Sparkles className="w-4 h-4" strokeWidth={2.5} />
          Comunidad Club Triple Impacto
        </div>

        {/* Titular con número animado */}
        <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">
          Ya somos más de{" "}
          <span className="text-teal-500">
            {contadorSocios.toLocaleString("es-AR")}
          </span>{" "}
          socios
        </h2>
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          Personas que donan mes a mes en Club Triple Impacto y hacen crecer
          el impacto colectivo. Cada nueva persona suma más beneficios y más
          ayuda para las ONGs.
        </p>

        {/* Cluster de avatares + badge de conteo */}
        <div className="flex items-center justify-center mb-10">
          <div className="flex -space-x-4">
            {AVATAR_GRADIENTS.map((gradient, index) => (
              <div
                key={index}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-linear-to-br ${gradient} border-4 border-white shadow-md flex items-center justify-center`}
              >
                <Users
                  className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                  strokeWidth={2}
                />
              </div>
            ))}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-teal-500 border-4 border-white shadow-md flex items-center justify-center">
              <span className="text-white text-xs sm:text-sm font-extrabold">
                +17K
              </span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/registro"
          className="inline-flex items-center gap-2 py-4 px-8 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl transition-all duration-300 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Heart className="w-5 h-5" strokeWidth={2.5} />
          Quiero sumarme
        </Link>
        <p className="text-sm text-gray-500 mt-4">
          Sumate hoy y empezá a generar impacto con tu donación mensual.
        </p>
      </div>
    </section>
  );
}
