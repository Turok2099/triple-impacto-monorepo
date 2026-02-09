"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function CouponCounter() {
  const [contadorCupones, setContadorCupones] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Detectar cuando la sección es visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
          }
        });
      },
      {
        threshold: 0.3, // Se activa cuando el 30% de la sección es visible
      }
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

  // Animación del contador de cupones totales (solo cuando es visible)
  useEffect(() => {
    if (!isVisible) return;

    let inicio = 0;
    const fin = 6000;
    const duracion = 2000; // 2 segundos
    const incremento = fin / (duracion / 16); // 60fps

    const timer = setInterval(() => {
      inicio += incremento;
      if (inicio >= fin) {
        setContadorCupones(fin);
        clearInterval(timer);
      } else {
        setContadorCupones(Math.floor(inicio));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isVisible]);

  return (
    <section ref={sectionRef} className="py-16 bg-linear-to-br from-emerald-50 to-emerald-100">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Grid con 2 columnas en desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Columna izquierda: Contador */}
            <div className="text-center lg:text-left">
              <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Descubrí los más de{" "}
                <span className="text-emerald-600">6000 cupones</span> que tenemos
                para ti
              </h3>
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                <div className="bg-white rounded-2xl shadow-xl px-8 py-6 inline-block">
                  <div className="text-6xl sm:text-7xl font-bold text-emerald-600">
                    +{contadorCupones.toLocaleString()}
                  </div>
                  <p className="text-gray-600 text-lg mt-2 font-semibold">
                    Cupones Disponibles
                  </p>
                </div>
              </div>
              <p className="text-gray-700 text-lg max-w-xl mx-auto lg:mx-0">
                Nuevos beneficios se agregan constantemente. ¡Seguí explorando y
                aprovechá descuentos exclusivos!
              </p>
            </div>

            {/* Columna derecha: Call to Action */}
            <div className="flex items-center justify-center lg:justify-end">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                <div className="text-center mb-6">
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">
                    ¡Comenzá a ahorrar hoy!
                  </h4>
                  <p className="text-gray-600">
                    Realizá tu primera donación y accedé a todos estos beneficios
                  </p>
                </div>
                <Link
                  href="/registro"
                  className="block w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all duration-300 text-center text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Donar ahora →
                </Link>
                <p className="text-sm text-gray-500 text-center mt-4">
                  Sin costos ocultos • Cancela cuando quieras
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
