"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, X, ExternalLink, Mail, Globe, Phone, MapPin } from "lucide-react";
import { obtenerOrganizaciones, type Organizacion } from "@/lib/payments";

const supabaseLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
  if (src.includes("supabase.co")) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(src)}&w=${width}&output=webp&q=${quality || 80}`;
  }
  return src;
};

interface PartnersSectionProps {
  hideHeader?: boolean;
  hideCTA?: boolean;
  className?: string;
}

export default function PartnersSection({ hideHeader = false, hideCTA = false, className }: PartnersSectionProps = {}) {
  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para el modal
  const [selectedOrg, setSelectedOrg] = useState<Organizacion | null>(null);

  // Carga inicial de organizaciones
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

    return () => { 
      cancelled = true; 
    };
  }, []);

  // Control del scroll cuando el modal está abierto
  useEffect(() => {
    if (selectedOrg) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => { 
      document.body.style.overflow = "auto";
    };
  }, [selectedOrg]);

  const handleCardClick = (org: Organizacion) => {
    setSelectedOrg(org);
  };

  const closeModal = () => setSelectedOrg(null);

  if (loading) {
    return (
      <section className={className || "py-20 px-4 sm:px-6 lg:px-8 bg-slate-50/80"}>
        <div className="max-w-7xl mx-auto">
          {!hideHeader && (
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1A202C] mb-3">
                ONGs
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
            ONGs
          </h2>
          <p className="text-slate-600">
            {error || "No hay organizaciones disponibles en este momento."}
          </p>
          <Link
            href="/donar"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-[#2c8184] text-white font-semibold rounded-xl hover:bg-[#2c8184] transition-colors"
          >
            <Heart className="w-4 h-4" />
            Ir a donar
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={className || "py-20 px-4 sm:px-6 lg:px-8 bg-slate-50/80 relative"}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {!hideHeader && (
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A202C] mb-3">
              ONGs
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Podés donar a cualquiera de estas organizaciones desde la plataforma
            </p>
          </div>
        )}

        {/* Mobile: cards horizontales (solo visible en móvil) */}
        <div className="space-y-4 md:hidden">
          {organizaciones.map((org) => {
            const logoUrl = org.logo_url;
            return (
              <div
                key={org.id}
                onClick={() => handleCardClick(org)}
                className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-50 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4 min-w-0 pointer-events-none">
                  <div className="size-16 rounded-full bg-transparent shrink-0 overflow-hidden flex items-center justify-center p-1 relative">
                    {logoUrl ? (
                      <Image 
                        loader={supabaseLoader}
                        src={logoUrl} 
                        alt={org.nombre} 
                        fill 
                        sizes="64px" 
                        className="object-contain p-1" 
                      />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-lg font-bold text-[#2c8184]">
                        {org.nombre.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-[#1A202C] text-sm leading-tight line-clamp-2">
                      {org.nombre}
                    </h2>
                    {org.descripcion && (
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-1">
                        {org.descripcion}
                      </p>
                    )}
                  </div>
                </div>
                <Link
                  href="/donar"
                  onClick={(e) => e.stopPropagation()}
                  className="bg-[#2c8184] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-teal-500/20 active:scale-95 transition-transform shrink-0"
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
            const logoUrl = org.logo_url;
            return (
              <div
                key={org.id}
                onClick={() => handleCardClick(org)}
                className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col items-center cursor-pointer"
              >
                <div className="p-8 pb-4 flex flex-col items-center grow text-center pointer-events-none">
                  <div className="h-28 w-full bg-transparent mb-6 shrink-0 overflow-hidden flex items-center justify-center p-2 relative">
                    {logoUrl ? (
                      <Image 
                        loader={supabaseLoader}
                        src={logoUrl} 
                        alt={org.nombre} 
                        fill 
                        sizes="120px" 
                        className="object-contain p-2" 
                      />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-2xl font-bold text-[#2c8184]">
                        {org.nombre.charAt(0)}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-[#1A202C] mb-1 group-hover:text-[#2c8184] transition-colors leading-tight line-clamp-2">
                    {org.nombre}
                  </h2>
                  {org.descripcion && (
                    <p className="text-xs text-slate-400 mt-4 leading-relaxed line-clamp-3">
                      {org.descripcion}
                    </p>
                  )}
                </div>
                <Link
                  href="/donar"
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-[#2c8184] text-white py-4 font-bold text-sm tracking-wide hover:bg-[#2c8184] transition-colors mt-auto text-center"
                >
                  Donar
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal / Vista Emergente */}
      {selectedOrg && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-10"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>

            <div className="p-8 md:p-10">
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 text-center sm:text-left">
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shrink-0 p-3 shadow-md border border-slate-100 relative overflow-hidden">
                  {(() => {
                    const logoUrl = selectedOrg.logo_url;
                    return logoUrl ? (
                      <Image 
                        loader={supabaseLoader}
                        src={logoUrl} 
                        alt={selectedOrg.nombre} 
                        fill 
                        sizes="96px" 
                        className="object-contain p-3" 
                      />
                    ) : (
                      <span className="text-4xl font-bold text-[#2c8184]">{selectedOrg.nombre.charAt(0)}</span>
                    );
                  })()}
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">{selectedOrg.nombre}</h2>
                  <p className="text-[#2c8184] font-medium text-sm">Organización Aliada</p>
                </div>
              </div>

              {selectedOrg.descripcion || selectedOrg.email || selectedOrg.telefono || selectedOrg.website_url ? (
                <div className="space-y-8">
                  {selectedOrg.descripcion && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Propósito</h3>
                      <p className="text-slate-700 leading-relaxed text-lg">
                        {selectedOrg.descripcion}
                      </p>
                    </div>
                  )}
                  
                  <div className="bg-slate-50 p-6 rounded-2xl space-y-5 border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Información y Contacto</h3>
                    {selectedOrg.email && (
                      <div className="flex items-start gap-4">
                        <Mail className="w-5 h-5 text-[#2c8184] mt-0.5 shrink-0" />
                        <p className="text-base text-slate-700 break-all sm:break-words">{selectedOrg.email}</p>
                      </div>
                    )}
                    {selectedOrg.telefono && (
                      <div className="flex items-start gap-4">
                        <Phone className="w-5 h-5 text-[#2c8184] mt-0.5 shrink-0" />
                        <p className="text-base text-slate-700">{selectedOrg.telefono}</p>
                      </div>
                    )}
                    {selectedOrg.direccion && (
                      <div className="flex items-start gap-4">
                        <MapPin className="w-5 h-5 text-[#2c8184] mt-0.5 shrink-0" />
                        <p className="text-base text-slate-700">{selectedOrg.direccion}</p>
                      </div>
                    )}
                    
                    {selectedOrg.website_url && (
                      <div className="flex items-start gap-4">
                        <Globe className="w-5 h-5 text-[#2c8184] mt-0.5 shrink-0" />
                        <a href={selectedOrg.website_url} target="_blank" rel="noopener noreferrer" className="text-base text-[#2c8184] hover:text-[#1e6063] hover:underline break-all">
                          {selectedOrg.website_url}
                        </a>
                      </div>
                    )}
                    
                    {selectedOrg.slug && (
                      <div className="flex items-start gap-4">
                        <ExternalLink className="w-5 h-5 text-[#2c8184] mt-0.5 shrink-0" />
                        <a href={selectedOrg.slug.startsWith('http') ? selectedOrg.slug : `https://${selectedOrg.slug}`} target="_blank" rel="noopener noreferrer" className="text-base text-[#2c8184] hover:text-[#1e6063] hover:underline break-all">
                          Sitio de beneficios Bonda
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-slate-600 text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
                  <p>{selectedOrg.descripcion || "No hay información detallada disponible para esta organización en este momento."}</p>
                </div>
              )}

              <div className="mt-10">
                <Link
                  href="/donar"
                  onClick={closeModal}
                  className="w-full flex justify-center items-center gap-2 bg-[#2c8184] text-white font-bold py-4 px-6 rounded-xl hover:bg-[#2c8184] transition-colors shadow-lg shadow-teal-500/20 text-lg active:scale-[0.98]"
                >
                  <Heart className="w-5 h-5" />
                  Donar a esta Organización
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
