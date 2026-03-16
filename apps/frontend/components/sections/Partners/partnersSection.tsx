"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { obtenerOrganizaciones, type Organizacion } from "@/lib/payments";
import { getOrganizationLogoUrl } from "@/lib/organization-logos";

interface PartnersSectionProps {
  hideHeader?: boolean;
  hideCTA?: boolean;
  className?: string;
}

export default function PartnersSection({ hideHeader = false, hideCTA = false, className }: PartnersSectionProps = {}) {
  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    obtenerOrganizaciones()
      .then((orgs) => {
        if (!cancelled) setOrganizaciones(orgs);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Error al cargar organizaciones");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <section className={className || "py-20 px-4 sm:px-6 lg:px-8 bg-slate-50/80"}>
        <div className="max-w-7xl mx-auto">
          {!hideHeader && (
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1A202C] mb-3">
                Nuestras ONGs aliadas
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Podés donar a cualquiera de estas organizaciones desde la plataforma
              </p>
            </div>
          )}
          {/* Mobile skeleton */}
          <div className="space-y-4 md:hidden">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-white border border-slate-50 shadow-[0_2px_12px_rgba(0,0,0,0.04)] animate-pulse"
              />
            ))}
          </div>
          {/* Desktop skeleton */}
          <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-72 rounded-3xl bg-white border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || organizaciones.length === 0) {
    return (
      <section className={className || "py-20 px-4 sm:px-6 lg:px-8 bg-slate-50/80"}>
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1A202C] mb-4">
            Nuestras ONGs aliadas
          </h2>
          <p className="text-slate-600">
            {error || "No hay organizaciones disponibles en este momento."}
          </p>
          <Link
            href="/donar"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors"
          >
            <Heart className="w-4 h-4" />
            Ir a donar
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={className || "py-20 px-4 sm:px-6 lg:px-8 bg-slate-50/80"}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {!hideHeader && (
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A202C] mb-3">
              Nuestras ONGs aliadas
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Podés donar a cualquiera de estas organizaciones desde la plataforma
            </p>
          </div>
        )}

        {/* Mobile: cards horizontales (solo visible en móvil) */}
        <div className="space-y-4 md:hidden">
          {organizaciones.map((org) => {
            const logoUrl = getOrganizationLogoUrl(org.nombre);
            return (
              <div
                key={org.id}
                className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-50"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className="size-16 rounded-full bg-transparent shrink-0 overflow-hidden flex items-center justify-center p-1"
                  >
                    {logoUrl ? (
                      <img src={logoUrl} alt={org.nombre} className="w-full h-full object-contain" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-lg font-bold text-teal-500">
                        {org.nombre.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#1A202C] text-sm leading-tight line-clamp-2">
                      {org.nombre}
                    </h3>
                    {org.descripcion && (
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-1">
                        {org.descripcion}
                      </p>
                    )}
                  </div>
                </div>
                <Link
                  href="/donar"
                  className="bg-teal-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-teal-500/20 active:scale-95 transition-transform shrink-0"
                >
                  Donar
                </Link>
              </div>
            );
          })}
        </div>

        {/* Desktop: grid de cards verticales (oculto en móvil) */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {organizaciones.map((org) => {
            const logoUrl = getOrganizationLogoUrl(org.nombre);
            return (
              <div
                key={org.id}
                className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col items-center"
              >
                <div className="p-8 pb-4 flex flex-col items-center grow text-center">
                  <div
                    className="h-28 w-full bg-transparent mb-6 shrink-0 overflow-hidden flex items-center justify-center p-2"
                  >
                    {logoUrl ? (
                       <img src={logoUrl} alt={org.nombre} className="w-full h-full object-contain" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-2xl font-bold text-teal-500">
                        {org.nombre.charAt(0)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-[#1A202C] mb-1 group-hover:text-teal-500 transition-colors leading-tight line-clamp-2">
                    {org.nombre}
                  </h3>
                  {org.descripcion && (
                    <p className="text-xs text-slate-400 mt-4 leading-relaxed line-clamp-3">
                      {org.descripcion}
                    </p>
                  )}
                </div>
                <Link
                  href="/donar"
                  className="w-full bg-teal-500 text-white py-4 font-bold text-sm tracking-wide hover:bg-teal-600 transition-colors mt-auto text-center"
                >
                  Donar
                </Link>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        {!hideCTA && (
          <div className="text-center mt-12">
            <Link
              href="/donar"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-teal-500 text-white font-semibold rounded-xl shadow-lg hover:bg-teal-600 hover:shadow-xl transition-all"
            >
              <Heart className="w-4 h-4" />
              Ver todas y donar
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
