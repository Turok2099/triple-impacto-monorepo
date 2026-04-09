"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function FounderQuote() {
  const [isVisible, setIsVisible] = useState(false);
  const phraseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (phraseRef.current) {
      observer.observe(phraseRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative py-16 sm:py-20 bg-gray-50 overflow-hidden">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Frase Resaltada */}
        <div
          ref={phraseRef}
          className={`max-w-4xl mx-auto text-center mb-40 mt-4 opacity-0 ${isVisible ? 'animate-slide-in-right' : ''}`}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight drop-shadow-sm cursor-default">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#40a8ab] to-teal-400">
              AYNI.
            </span>
            {" "}
            <span className="text-gray-800">
              LO QUE DAS, VUELVE!
            </span>
          </h2>
        </div>

        <div className="relative max-w-sm mx-auto mt-16 mb-8">
          <div className="rounded-2xl overflow-hidden shadow-xl bg-white">
            {/* Foto del fundador - flotando arriba */}
            <div className="absolute -mt-20 w-full flex justify-center">
              <div className="h-32 w-32">
                <Image
                  src="https://res.cloudinary.com/dxbtafe9u/image/upload/v1768272488/FOTO_MARIANO_LEGUIZAMON_2024_sxo0vt.jpg"
                  alt="Mariano Leguizamón"
                  width={128}
                  height={128}
                  className="rounded-full object-cover h-full w-full shadow-2xl border-4 border-white"
                  priority
                />
              </div>
            </div>

            {/* Contenido */}
            <div className="px-6 mt-16">
              <h1 className="font-bold text-3xl text-center mb-1 text-gray-900">
                Mariano Leguizamón
              </h1>
              <p className="text-gray-600 text-sm text-center">
                Co Fundador, AYNI
              </p>
              <p className="text-center text-gray-700 text-base pt-6 font-normal leading-relaxed italic">
                "La solidaridad es un acto de amor, es un acto de justicia, es un acto de humanidad.{" "}
                <span className="text-[#40a8ab] font-semibold">
                  Cada vez que compramos y vendemos, elegimos el mundo en el que queremos vivir"
                </span>
              </p>

              {/* Iconos de redes sociales */}
              <div className="w-full flex justify-center pt-6 pb-6">
                <a
                  href="https://www.instagram.com/ayni.loquedasvuelve?igsh=emZzOGIzd25ldjZz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mx-5 hover:scale-110 transition-transform"
                  aria-label="Instagram"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#40a8ab"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="2"
                      y="2"
                      width="20"
                      height="20"
                      rx="5"
                      ry="5"
                    ></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
                <a
                  href="https://www.linkedin.com/company/comunidad-club-triple-impacto/posts/?feedView=all"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mx-5 hover:scale-110 transition-transform"
                  aria-label="LinkedIn"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#40a8ab"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                </a>
                <a
                  href="https://wa.me/5491156393261"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mx-5 hover:scale-110 transition-transform"
                  aria-label="WhatsApp"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#40a8ab"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
