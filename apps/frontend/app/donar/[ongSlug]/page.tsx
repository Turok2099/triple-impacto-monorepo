"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import PaymentFormExclusive from "@/components/donar/PaymentFormExclusive";
import { Loader2, AlertTriangle, ArrowLeft, LogIn, User } from "lucide-react";
import { type Organizacion } from "@/lib/payments";
import { getOrganizationLogoUrl } from "@/lib/organization-logos";

export default function DonarExclusivePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const ongSlug = params.ongSlug as string;

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loadingOrg, setLoadingOrg] = useState(true);
  const [organizacion, setOrganizacion] = useState<Organizacion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const logoUrl = organizacion
    ? organizacion.logo_url || getOrganizationLogoUrl(organizacion.nombre, organizacion.slug || ongSlug)
    : null;

  // 1. Validar autenticación (no redireccionar automáticamente)
  useEffect(() => {
    if (!authLoading) {
      setCheckingAuth(false);
    }
  }, [authLoading]);

  // 2. Cargar datos de la ONG por su slug
  useEffect(() => {
    if (ongSlug) {
      cargarOrganizacion();
    }
  }, [ongSlug]);

  const cargarOrganizacion = async () => {
    try {
      setLoadingOrg(true);
      setError(null);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/public/organizaciones/slug/${ongSlug}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("La organización no existe o no se encuentra activa.");
        }
        throw new Error("Error al cargar la información de la ONG.");
      }

      const data = await response.json();
      
      // Validar si tiene Fiserv configurado
      if (!data.has_fiserv_config) {
        throw new Error("Esta organización no tiene habilitado el canal de donación segura.");
      }

      setOrganizacion(data);
    } catch (err: any) {
      setError(err.message || "Error de conexión con el servidor");
    } finally {
      setLoadingOrg(false);
    }
  };

  if (authLoading || checkingAuth || loadingOrg) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#2c8184]" />
      </div>
    );
  }

  if (error || !organizacion) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-100 text-center shadow-sm">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Error de Acceso</h2>
          <p className="text-slate-500 mb-8">{error || "No pudimos cargar la página de donación."}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 bg-[#2c8184] text-white rounded-2xl font-semibold hover:bg-teal-600 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  // Renderizado principal con diseño de dos columnas
  return (
    <div className="min-h-screen bg-[#f4fafb] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-center">
          
          {/* Columna Izquierda: Tarjeta de Pago o Selección de Cuenta */}
          <div className="lg:col-span-7 flex justify-center">
            {!isAuthenticated ? (
              <div className="max-w-2xl w-full bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-md">
                {/* Banner superior estilo AYNI */}
                <div className="bg-[#2c8184] p-6 text-center text-white">
                  <h3 className="text-lg font-bold tracking-wide uppercase">
                    {organizacion.nombre?.toUpperCase().startsWith("CLUB")
                      ? `${organizacion.nombre} ¡¡DONAR TIENE PREMIO!!`
                      : `CLUB ${organizacion.nombre} ¡¡DONAR TIENE PREMIO!!`}
                  </h3>
                </div>
                
                <div className="p-8">
                  <div className="mb-6 text-center">
                    <div className="flex items-center justify-center gap-6 mb-6 flex-wrap">
                      {logoUrl && (
                        <img src={logoUrl} alt={organizacion.nombre} className="h-14 md:h-24 w-auto object-contain" />
                      )}
                      <span className="text-3xl md:text-5xl font-light text-slate-300">+</span>
                      <img
                        src="https://res.cloudinary.com/dxbtafe9u/image/upload/q_auto,f_auto,w_200,c_limit/v1775685229/ISOLOGOTIPO_AYNI_VERDE_FONDO_TRANSPARENTE_lx4yvh.png"
                        alt="AYNI"
                        className="h-14 md:h-24 w-auto object-contain"
                      />
                    </div>
                    <h2 className="sr-only">
                      {organizacion.nombre} y AYNI - CLUB TRIPLE IMPACTO
                    </h2>
                    <p className="text-slate-500 text-sm md:text-base leading-relaxed text-center max-w-xl mx-auto">
                      {organizacion.nombre?.toUpperCase().includes("PLATO LLENO") ? (
                        "AYNI y Plato Lleno colaboran para llevar a sus donantes una plataforma de triple impacto única. Con tu aporte mensual, ayudás directamente a sostener el programa de rescate de alimentos de Plato Lleno y, al mismo tiempo, accedés de forma exclusiva a la Red de Beneficios de Club Triple Impacto como agradecimiento por tu compromiso."
                      ) : (
                        organizacion.descripcion || `¡Sumate y sé parte del Triple Impacto! Con tu aporte mensual, nos ayudás a sostener proyectos de impacto y como agradecimiento accedés a nuestra red de beneficios y descuentos exclusivos.`
                      )}
                    </p>
                  </div>

                  {/* Bonda Discounts Benefit Badge */}
                  <div className="mb-6 bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                    <img
                      src="https://res.cloudinary.com/dxbtafe9u/image/upload/v1781655035/bonda_ujsbcf.png"
                      alt="Bonda"
                      className="h-10 md:h-18 w-auto object-contain shrink-0"
                    />
                    <div className="space-y-0.5">
                      <h4 className="text-sm md:text-base font-bold text-slate-800">Portal de Beneficios Bonda</h4>
                      <p className="text-xs md:text-sm text-slate-500 font-semibold leading-relaxed">
                        Con tu donación mensual, accedés a más de <span className="font-bold text-[#2c8184]">1700 cupones de descuento exclusivos</span> en primeras marcas nacionales.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-teal-50/30 rounded-2xl p-6 border border-teal-100/50 text-center">
                    <p className="text-slate-700 text-sm font-semibold mb-6">
                      Para realizar tu donación de forma segura, seleccioná una de las siguientes opciones:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => router.push(`/login?redirect=/donar/${ongSlug}`)}
                        className="w-full py-4 px-6 bg-[#2c8184] hover:bg-teal-600 text-white rounded-2xl font-bold transition-all cursor-pointer shadow-md flex items-center justify-between gap-4 group"
                      >
                        <div className="flex items-center gap-3 text-left">
                          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <LogIn className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">Tengo cuenta</span>
                            <span className="text-[10px] text-teal-50 font-normal">Iniciar sesión y donar</span>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => router.push(`/registro?redirect=/donar/${ongSlug}`)}
                        className="w-full py-4 px-6 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                      >
                        <div className="flex items-center gap-3 text-left">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-slate-200/70 transition-colors flex items-center justify-center">
                            <User className="w-5 h-5 text-slate-500" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">Donaré por primera vez</span>
                            <span className="text-[10px] text-slate-400 font-normal">Crear una cuenta nueva</span>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-350">
                <PaymentFormExclusive
                  organizacion={organizacion}
                  onSuccess={(data) => console.log('Donación exclusiva exitosa', data)}
                />
              </div>
            )}
          </div>
          
          {/* Columna Derecha: Sidebar con información de la ONG (Solo visible en desktop) */}
          <div className="lg:col-span-3 hidden lg:block">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md sticky top-24 space-y-6">
              {logoUrl && (
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border border-slate-100 shadow-sm flex items-center justify-center bg-white p-2">
                  <img src={logoUrl} alt={organizacion.nombre} className="max-w-full max-h-full object-contain" />
                </div>
              )}
              
              {organizacion.nombre?.toUpperCase().includes("PLATO LLENO") ? (
                <>
                  <div className="text-center space-y-2">
                    <h3 className="font-bold text-lg text-slate-800 uppercase tracking-tight">
                      Proyecto Plato Lleno
                    </h3>
                    <div className="text-[11px] text-slate-500 font-bold">
                      Capital Federal, Argentina
                    </div>
                    <div className="text-[11px] bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-bold inline-block">
                      ORGANIZACIÓN VERIFICADA
                    </div>
                  </div>
                  
                  <div className="space-y-4 text-xs text-slate-500 leading-relaxed">
                    <p>
                      Red Plato Lleno es una iniciativa de concientización alimentaria que busca devolverle al alimento el valor que fue perdiendo durante los últimos tiempos. Motivados por el respeto a la comida, voluntarios de Plato Lleno llevan a cabo la acción de «Rescate», la cual consiste en el retiro y distribución de alimentos excedentes que, por control estético u otras razones, quedan sin destino. Los alimentos rescatados son entregados de forma gratuita en merenderos, comedores y hogares.
                    </p>
                    
                    <div className="bg-[#2c8184]/5 border border-[#2c8184]/10 rounded-2xl p-4 text-center">
                      <p className="font-bold text-teal-900 mb-1">
                        En el 2022 rescatamos 104 toneladas de alimentos
                      </p>
                      <p className="text-[11px] text-teal-700 font-bold">
                        lo que equivale a 304.232 platos de comida.
                      </p>
                    </div>

                    <p className="font-bold text-slate-700 text-center text-xs">
                      ¡Imaginate cuánto más podríamos hacer con tu aporte!
                    </p>

                    <p className="text-[10px] text-slate-400 leading-normal border-t border-slate-100 pt-3">
                      Somos una organización sin fines de lucro, independiente, que no acepta donaciones de gobiernos o partidos políticos. Tampoco aceptamos “colaboraciones simbólicas” de los sectores beneficiados con nuestros programas. Nuestro compromiso para con nuestros donantes garantiza transparencia, pues son nuestros principales auditores.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center space-y-2">
                    <h3 className="font-bold text-lg text-slate-800 uppercase tracking-tight">
                      {organizacion.nombre}
                    </h3>
                    <div className="text-[11px] bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-bold inline-block">
                      ORGANIZACIÓN VERIFICADA
                    </div>
                  </div>
                  
                  <p className="text-slate-500 text-xs leading-relaxed text-center">
                    {organizacion.descripcion || "Iniciativa de impacto social que trabaja activamente para transformar la realidad de los sectores más vulnerables."}
                  </p>
                  
                  <hr className="border-slate-100" />
                  
                  <div className="space-y-3 text-xs text-slate-600">
                    {organizacion.direccion && (
                      <div className="flex items-start gap-2.5">
                        <span className="font-semibold text-slate-800">Dirección:</span>
                        <span className="text-slate-500">{organizacion.direccion}</span>
                      </div>
                    )}
                    {organizacion.email && (
                      <div className="flex items-start gap-2.5">
                        <span className="font-semibold text-slate-800">Email:</span>
                        <a href={`mailto:${organizacion.email}`} className="text-[#2c8184] hover:underline break-all">{organizacion.email}</a>
                      </div>
                    )}
                    {organizacion.telefono && (
                      <div className="flex items-start gap-2.5">
                        <span className="font-semibold text-slate-800">Teléfono:</span>
                        <span className="text-slate-500">{organizacion.telefono}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {organizacion.website_url && (
                <a
                  href={organizacion.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2.5 text-center bg-teal-50 hover:bg-teal-100 text-[#2c8184] font-bold rounded-2xl text-xs transition-colors"
                >
                  Visitar sitio web
                </a>
              )}
              
              <div className="pt-2 text-center text-[10px] text-slate-400">
                Donaciones seguras procesadas por AYNI.
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
