"use client";

import { getAllPartners } from "@/lib/partners";
import Link from "next/link";
import { ArrowLeft, Handshake, Users, ShieldCheck, Target } from "lucide-react";

export default function ONGsPage() {
  const allPartners = getAllPartners();
  const totalBeneficiaries = allPartners.reduce(
    (sum, partner) => sum + partner.beneficiaries,
    0
  );
  const totalProjects = allPartners.reduce(
    (sum, partner) => sum + (partner.activeProjects || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto mt-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Nuestras ONGs Aliadas
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Trabajamos exclusivamente con organizaciones certificadas, auditadas
            y con trayectoria comprobada en el impacto social
          </p>
        </div>

        {/* Stats */}
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:px-24 md:py-16 lg:px-8 lg:py-20 mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4">
            <div className="mb-12 text-center md:mb-0 md:border-r-2 md:border-gray-200">
              {/* Icono */}
              <div className="flex justify-center mb-4">
                <Handshake
                  className="w-12 h-12 text-[#16a459]"
                  strokeWidth={1.5}
                />
              </div>

              {/* Valor */}
              <div className="font-bold text-[2.6rem] lg:text-5xl xl:text-6xl text-[#16a459] mb-2">
                {allPartners.length}
              </div>

              {/* Label */}
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-800 lg:text-sm px-2">
                ONGs Aliadas
              </p>
            </div>

            <div className="mb-12 text-center md:mb-0 md:border-r-2 md:border-gray-200">
              {/* Icono */}
              <div className="flex justify-center mb-4">
                <Users className="w-12 h-12 text-[#16a459]" strokeWidth={1.5} />
              </div>

              {/* Valor */}
              <div className="font-bold text-[2.6rem] lg:text-5xl xl:text-6xl text-[#16a459] mb-2">
                {totalBeneficiaries.toLocaleString()}+
              </div>

              {/* Label */}
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-800 lg:text-sm px-2">
                Beneficiarios
              </p>
            </div>

            <div className="mb-12 text-center md:mb-0 md:border-r-2 md:border-gray-200">
              {/* Icono */}
              <div className="flex justify-center mb-4">
                <ShieldCheck
                  className="w-12 h-12 text-[#16a459]"
                  strokeWidth={1.5}
                />
              </div>

              {/* Valor */}
              <div className="font-bold text-[2.6rem] lg:text-5xl xl:text-6xl text-[#16a459] mb-2">
                100%
              </div>

              {/* Label */}
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-800 lg:text-sm px-2">
                Certificadas
              </p>
            </div>

            <div className="mb-12 text-center md:mb-0">
              {/* Icono */}
              <div className="flex justify-center mb-4">
                <Target
                  className="w-12 h-12 text-[#16a459]"
                  strokeWidth={1.5}
                />
              </div>

              {/* Valor */}
              <div className="font-bold text-[2.6rem] lg:text-5xl xl:text-6xl text-[#16a459] mb-2">
                {totalProjects}
              </div>

              {/* Label */}
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-800 lg:text-sm px-2">
                Proyectos Activos
              </p>
            </div>
          </div>
        </div>

        {/* Grid de ONGs */}
        <div className="grid gap-x-8 gap-y-12 sm:gap-y-16 md:grid-cols-2 lg:grid-cols-3">
          {allPartners.map((partner, index) => (
            <div
              key={partner.id}
              className="relative"
              style={{
                animation: `fadeIn 0.6s ease-out ${index * 0.05}s both`,
              }}
            >
              {/* Card con imagen/logo */}
              <div className="block overflow-hidden group rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer">
                <div
                  className="w-full h-56 sm:h-64 flex items-center justify-center text-7xl transition-all duration-300 ease-out group-hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${
                      index % 3 === 0
                        ? "#16a459"
                        : index % 3 === 1
                        ? "#385da0"
                        : "#cfc755"
                    } 0%, ${
                      index % 3 === 0
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
                <h2 className="font-bold text-2xl text-gray-900 mb-3 leading-tight">
                  {partner.name}
                </h2>

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
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#16a459] font-semibold text-sm hover:underline inline-flex items-center gap-1"
                  >
                    Conocer más
                    <span aria-hidden="true">→</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Final */}
        <div className="mt-20 text-center bg-linear-to-br from-emerald-500 to-blue-600 rounded-3xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">¿Tu ONG quiere unirse?</h2>
          <p className="text-emerald-50 mb-6 max-w-2xl mx-auto">
            Si representas una organización sin fines de lucro y quieres formar
            parte de nuestra red, contáctanos
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-4 bg-white text-emerald-700 font-bold rounded-xl hover:shadow-xl transition-all"
          >
            Contactar para alianzas
          </Link>
        </div>
      </div>
    </div>
  );
}
