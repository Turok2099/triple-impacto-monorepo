"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, X, ExternalLink, Mail, Globe, Phone, MapPin } from "lucide-react";
import { obtenerOrganizaciones, type Organizacion } from "@/lib/payments";
import { getOrganizationLogoUrl } from "@/lib/organization-logos";

interface PartnersSectionProps {
  hideHeader?: boolean;
  hideCTA?: boolean;
  className?: string;
}

const ONG_DETAILS = [
  {
    "organizacion": "Bibliotecas Rurales Argentinas",
    "proposito": "Asociación civil fundada en 1963 que busca garantizar el acceso igualitario a la cultura y la educación en todo el país. Se dedica a crear y fortalecer bibliotecas en comunidades rurales y aisladas para que a nadie le falte un centro de lectura y aprendizaje cercano.",
    "email": "comunicacionbibliotecasrurales@gmail.com",
    "telefono": "+54 (011) 4774-8938",
    "sitio_web": "https://www.bibliotecasrurales.org.ar/",
    "sitio_bonda": "https://beneficiosbibliotecaruralesargentinas.bonda.com/"
  },
  {
    "organizacion": "Haciendo Camino",
    "proposito": "Trabaja para mejorar la calidad de vida de familias en situación de vulnerabilidad social en el Norte argentino. Su enfoque integral combina programas de nutrición, prevención de la desnutrición infantil, estimulación temprana y capacitación en oficios para las madres.",
    "email": "info@haciendocamino.org.ar",
    "telefono": "+54 9 11 5199-6482",
    "sitio_web": "https://haciendocamino.org.ar/",
    "sitio_bonda": "https://beneficioshaciendocamino.bonda.com/"
  },
  {
    "organizacion": "Mamis Solidarias",
    "proposito": "Organización que lucha por una infancia con igualdad de oportunidades a través de programas de apoyo escolar, alimentación y contención emocional. Trabajan activamente en merenderos y centros propios en el Gran Buenos Aires y Misiones.",
    "email": "info@mamissolidarias.org.ar",
    "sitio_web": "https://www.mamissolidarias.org.ar/",
    "sitio_bonda": "https://comunidadmamissolidarias.bonda.com/"
  },
  {
    "organizacion": "Plato Lleno",
    "proposito": "Iniciativa solidaria que busca evitar el desperdicio de alimentos. Se encargan de 'rescatar' comida excedente de eventos y comercios, que se encuentra en perfecto estado, para distribuirla de forma inmediata en comedores e instituciones que la necesitan.",
    "email": "proyectoplatolleno@gmail.com | logistica@platolleno.org",
    "sitio_web": "https://www.platolleno.org/buenos-aires.html",
    "sitio_bonda": "https://clubplatolleno.bonda.com/"
  },
  {
    "organizacion": "Monte Adentro",
    "proposito": "Promueve el desarrollo integral de comunidades rurales en el Chaco argentino. Trabaja en ejes de educación, salud, oficios e infraestructura, buscando que las familias puedan crecer y progresar en su lugar de origen con dignidad y oportunidades.",
    "email": "hola@monteadentro.org",
    "telefono": "+54 9 11 6657-1366",
    "sitio_web": "https://monteadentro.org/",
    "sitio_bonda": "https://beneficiosmonteadentro.bonda.com/"
  },
  {
    "organizacion": "Fundación Padres",
    "proposito": "Institución dedicada a concientizar a los padres sobre su rol protagónico en la crianza y educación de sus hijos. Busca fortalecer el vínculo familiar para prevenir conductas de riesgo y promover el desarrollo de hijos saludables emocionalmente.",
    "email": "info@fundacionpadres.org",
    "telefono": "+54 11 4805-5693",
    "sitio_web": "https://fundacionpadres.org/inicio/",
    "sitio_bonda": "https://beneficiosfundacionpadres.bonda.com/"
  },
  {
    "organizacion": "Proactiva",
    "proposito": "ONG que trabaja por la inclusión social y laboral de personas con discapacidad intelectual y psicosocial. A través de su programa 'Feriactivos', impulsan el emprendedurismo y la visibilización de las capacidades de las personas para su participación activa en la comunidad.",
    "email": "info@proactivaac.org",
    "sitio_web": "https://proactivaac.org/",
    "sitio_bonda": "https://clubproactiva.bonda.com/"
  },
  {
    "organizacion": "La Guarida",
    "proposito": "Proyecto innovador que construye consolas de videojuegos artesanales e intervenidas artísticamente para donarlas a hospitales públicos pediátricos. Su misión es utilizar el juego como una herramienta terapéutica para ayudar a los niños a transitar sus tratamientos.",
    "email": "hola@laguarida.org.ar",
    "sitio_web": "https://laguarida.org.ar/",
    "sitio_bonda": "https://beneficioslaguarida.com/"
  },
  {
    "organizacion": "Techo Argentina",
    "proposito": "Organización presente en Latinoamérica que busca superar la situación de pobreza en los asentamientos populares. Trabaja mediante la construcción de viviendas de emergencia y proyectos de desarrollo comunitario liderados por jóvenes voluntarios y vecinos.",
    "email": "info.argentina@techo.org",
    "telefono": "0810-345-0504",
    "sitio_web": "https://argentina.techo.org/",
    "sitio_bonda": "https://comunidadtecho.com/"
  },
  {
    "organizacion": "Regenerar",
    "proposito": "Fundación dedicada a la gestión ambiental y la promoción de la economía circular. Trabaja en la educación ambiental y en la implementación de sistemas de reciclaje y compostaje para reducir el impacto negativo de los residuos en el planeta.",
    "email": "contacto@regenerar.org.ar",
    "sitio_web": "https://www.regenerar.org.ar/",
    "sitio_bonda": "https://regenerarclub.com/"
  },
  {
    "organizacion": "Loros Parlantes",
    "proposito": "Asociación que utiliza la expresión artística, la comunicación y la creatividad como medios para la inclusión social de jóvenes con discapacidad. Fomenta un espacio de convivencia donde se estimulan talentos individuales para potenciar la autonomía.",
    "email": "lorosparlantesoficial@gmail.com",
    "sitio_web": "https://lorosparlantes.org.ar/",
    "sitio_bonda": "https://beneficioslorosparlantes.com/"
  },
  {
    "organizacion": "Proyectar ONG",
    "proposito": "Organización impulsada por la vocación de generar un impacto social y ambiental positivo. A través de sus mesas de Educación y Ambiente, construyen puentes entre comunidades e instituciones para responder a dos grandes preguntas: '¿qué planeta le dejamos a nuestros hijos?' y '¿qué hijos les dejamos a nuestro planeta?'. Su objetivo es promover la integración ciudadana para garantizar un futuro más justo, solidario y sostenible.",
    "email": "contacto@proyectarong.ar",
    "telefono": "+54 9 11 3770 - 6653",
    "direccion": "Marcos Sastre 1031, Tigre",
    "sitio_web": "https://proyectarong.ar/",
    "sitio_bonda": "https://beneficioslorosparlantes.com/"
  }
];

export default function PartnersSection({ hideHeader = false, hideCTA = false, className }: PartnersSectionProps = {}) {
  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para el modal
  const [selectedOrg, setSelectedOrg] = useState<(Organizacion & { details?: any }) | null>(null);

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

    // Control del scroll cuando el modal está abierto
    if (selectedOrg) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => { 
      cancelled = true; 
      document.body.style.overflow = "auto";
    };
  }, [selectedOrg]);

  const handleCardClick = (org: Organizacion) => {
    const detail = ONG_DETAILS.find((d) => {
      const orgName = org.nombre.toLowerCase().trim();
      const detailName = d.organizacion.toLowerCase().trim();
      return orgName === detailName || 
             detailName.includes(orgName) || 
             orgName.includes(detailName);
    });
    setSelectedOrg({ ...org, details: detail });
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
            const logoUrl = getOrganizationLogoUrl(org.nombre);
            return (
              <div
                key={org.id}
                onClick={() => handleCardClick(org)}
                className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-50 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4 min-w-0 pointer-events-none">
                  <div className="size-16 rounded-full bg-transparent shrink-0 overflow-hidden flex items-center justify-center p-1">
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
                  onClick={(e) => e.stopPropagation()}
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
                onClick={() => handleCardClick(org)}
                className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col items-center cursor-pointer"
              >
                <div className="p-8 pb-4 flex flex-col items-center grow text-center pointer-events-none">
                  <div className="h-28 w-full bg-transparent mb-6 shrink-0 overflow-hidden flex items-center justify-center p-2">
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
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-teal-500 text-white py-4 font-bold text-sm tracking-wide hover:bg-teal-600 transition-colors mt-auto text-center"
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
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shrink-0 p-3 shadow-md border border-slate-100">
                  {(() => {
                    const logoUrl = getOrganizationLogoUrl(selectedOrg.nombre);
                    return logoUrl ? (
                      <img src={logoUrl} alt={selectedOrg.nombre} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-4xl font-bold text-teal-500">{selectedOrg.nombre.charAt(0)}</span>
                    );
                  })()}
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">{selectedOrg.nombre}</h2>
                  <p className="text-teal-600 font-medium text-sm">Organización Aliada</p>
                </div>
              </div>

              {selectedOrg.details ? (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Propósito</h3>
                    <p className="text-slate-700 leading-relaxed text-lg">
                      {selectedOrg.details.proposito}
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 p-6 rounded-2xl space-y-5 border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Información y Contacto</h3>
                    {selectedOrg.details.email && (
                      <div className="flex items-start gap-4">
                        <Mail className="w-5 h-5 text-teal-500 mt-0.5 shrink-0" />
                        <p className="text-base text-slate-700 break-all sm:break-words">{selectedOrg.details.email}</p>
                      </div>
                    )}
                    {selectedOrg.details.telefono && (
                      <div className="flex items-start gap-4">
                        <Phone className="w-5 h-5 text-teal-500 mt-0.5 shrink-0" />
                        <p className="text-base text-slate-700">{selectedOrg.details.telefono}</p>
                      </div>
                    )}
                    {selectedOrg.details.direccion && (
                      <div className="flex items-start gap-4">
                        <MapPin className="w-5 h-5 text-teal-500 mt-0.5 shrink-0" />
                        <p className="text-base text-slate-700">{selectedOrg.details.direccion}</p>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-4">
                      <Globe className="w-5 h-5 text-teal-500 mt-0.5 shrink-0" />
                      <a href={selectedOrg.details.sitio_web} target="_blank" rel="noopener noreferrer" className="text-base text-teal-600 hover:text-teal-700 hover:underline break-all">
                        {selectedOrg.details.sitio_web}
                      </a>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <ExternalLink className="w-5 h-5 text-teal-500 mt-0.5 shrink-0" />
                      <a href={selectedOrg.details.sitio_bonda} target="_blank" rel="noopener noreferrer" className="text-base text-teal-600 hover:text-teal-700 hover:underline break-all">
                        Sitio de beneficios Bonda
                      </a>
                    </div>
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
                  className="w-full flex justify-center items-center gap-2 bg-teal-500 text-white font-bold py-4 px-6 rounded-xl hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/20 text-lg active:scale-[0.98]"
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
