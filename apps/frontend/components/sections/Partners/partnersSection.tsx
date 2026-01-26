"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllPartners } from "@/lib/partners";
import { Partner } from "@/components/sections/WhyDonate/types";

// Función para obtener 3 ONGs aleatorias sin duplicados
const getRandomPartners = (
  allPartners: Partner[],
  count: number = 3
): Partner[] => {
  const shuffled = [...allPartners].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export default function PartnersSection() {
  const allPartners = getAllPartners();
  // Inicializar con las primeras 3 ONGs (sin aleatoriedad) para evitar error de hidratación
  const [displayedPartners, setDisplayedPartners] = useState<Partner[]>(
    allPartners.slice(0, 3)
  );

  useEffect(() => {
    // Hacer la primera selección aleatoria después de montar el componente
    setDisplayedPartners(getRandomPartners(allPartners, 3));

    // Configurar el intervalo para cambios subsecuentes
    const interval = setInterval(() => {
      setDisplayedPartners(getRandomPartners(allPartners, 3));
    }, 6000); // Cambia cada 6 segundos

    return () => clearInterval(interval);
  }, [allPartners]);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Nuestras ONGs aliadas
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Trabajamos exclusivamente con organizaciones certificadas, auditadas
            y con trayectoria comprobada
          </p>
        </div>

        {/* Grid de ONGs */}
        <div className="grid gap-x-8 gap-y-12 sm:gap-y-16 md:grid-cols-2 lg:grid-cols-3">
          {displayedPartners.map((partner, index) => (
            <div
              key={`${partner.id}-${Date.now()}`}
              className="relative animate-fadeIn"
              style={{
                animation: `fadeIn 1.2s ease-in-out ${index * 0.2}s both`,
              }}
            >
              {/* Card con imagen/logo interactivo */}
              {partner.website ? (
                partner.website.startsWith("/") ? (
                  <Link href={partner.website} className="block overflow-hidden group rounded-xl shadow-lg cursor-pointer">
                    <div
                      className="w-full h-56 sm:h-64 flex items-center justify-center text-7xl transition-all duration-300 ease-out group-hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${index % 3 === 0
                            ? "#16a459"
                            : index % 3 === 1
                              ? "#385da0"
                              : "#cfc755"
                          } 0%, ${index % 3 === 0
                            ? "#0d8745"
                            : index % 3 === 1
                              ? "#2a4a80"
                              : "#b8af42"
                          } 100%)`,
                      }}
                    >
                      {partner.logo.startsWith("http") ? (
                        <div className="w-full h-full flex items-center justify-center bg-white p-8">
                          <img
                            src={partner.logo}
                            alt={partner.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        partner.logo
                      )}
                    </div>
                  </Link>
                ) : (
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden group rounded-xl shadow-lg cursor-pointer"
                  >
                    <div
                      className="w-full h-56 sm:h-64 flex items-center justify-center text-7xl transition-all duration-300 ease-out group-hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${index % 3 === 0
                            ? "#16a459"
                            : index % 3 === 1
                              ? "#385da0"
                              : "#cfc755"
                          } 0%, ${index % 3 === 0
                            ? "#0d8745"
                            : index % 3 === 1
                              ? "#2a4a80"
                              : "#b8af42"
                          } 100%)`,
                      }}
                    >
                      {partner.logo.startsWith("http") ? (
                        <div className="w-full h-full flex items-center justify-center bg-white p-8">
                          <img
                            src={partner.logo}
                            alt={partner.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        partner.logo
                      )}
                    </div>
                  </a>
                )
              ) : (
                <div className="block overflow-hidden group rounded-xl shadow-lg cursor-pointer">
                  <div
                    className="w-full h-56 sm:h-64 flex items-center justify-center text-7xl transition-all duration-300 ease-out group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${index % 3 === 0
                          ? "#16a459"
                          : index % 3 === 1
                            ? "#385da0"
                            : "#cfc755"
                        } 0%, ${index % 3 === 0
                          ? "#0d8745"
                          : index % 3 === 1
                            ? "#2a4a80"
                            : "#b8af42"
                        } 100%)`,
                    }}
                  >
                    {partner.logo.startsWith("http") ? (
                      <div className="w-full h-full flex items-center justify-center bg-white p-8">
                        <img
                          src={partner.logo}
                          alt={partner.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      partner.logo
                    )}
                  </div>
                </div>
              )}

              {/* Contenido de la card */}
              <div className="relative mt-5">
                {/* Badge de certificación */}
                <div className="flex items-center gap-2 mb-3">
                  {partner.certified && (
                    <span className="uppercase font-semibold text-xs px-3 py-1 rounded-full bg-[#16a459] text-white">
                      ✓ Certificada
                    </span>
                  )}
                  {partner.activeProjects && (
                    <span className="text-xs font-normal text-gray-600">
                      {partner.activeProjects} proyectos activos
                    </span>
                  )}
                </div>

                {/* Título */}
                <h4 className="font-bold text-2xl text-gray-900 mb-3 leading-tight">
                  {partner.name}
                </h4>

                {/* Descripción */}
                <p className="text-gray-700 text-base font-normal leading-relaxed mb-4">
                  {partner.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-2 text-sm mb-4">
                  <span className="text-lg">👥</span>
                  <span className="text-gray-900">
                    <span className="font-semibold text-[#16a459]">
                      {partner.beneficiaries}+
                    </span>{" "}
                    <span className="text-gray-700">beneficiarios</span>
                  </span>
                </div>

                {/* Link */}
                {partner.website && (
                  partner.website.startsWith("/") ? (
                    <Link
                      href={partner.website}
                      className="text-[#16a459] font-semibold text-sm hover:underline inline-flex items-center gap-1"
                    >
                      Conocer más
                      <span aria-hidden="true">→</span>
                    </Link>
                  ) : (
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#16a459] font-semibold text-sm hover:underline inline-flex items-center gap-1"
                    >
                      Conocer más
                      <span aria-hidden="true">→</span>
                    </a>
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA para ver todas las ONGs */}
        <div className="text-center mt-12">
          <Link
            href="/ongs"
            className="inline-block px-8 py-3 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            style={{ backgroundColor: "#16a459" }}
          >
            Ver todas nuestras ONGs aliadas
          </Link>
        </div>
      </div>
    </section>
  );
}
