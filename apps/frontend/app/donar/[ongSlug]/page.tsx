"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import PaymentFormExclusive from "@/components/donar/PaymentFormExclusive";
import { Loader2, AlertTriangle, ArrowLeft, LogIn, User } from "lucide-react";
import { type Organizacion } from "@/lib/payments";

export default function DonarExclusivePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const ongSlug = params.ongSlug as string;

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loadingOrg, setLoadingOrg] = useState(true);
  const [organizacion, setOrganizacion] = useState<Organizacion | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        <Loader2 className="w-10 h-10 animate-spin text-[#40a8ab]" />
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
            className="w-full py-3 bg-[#40a8ab] text-white rounded-2xl font-semibold hover:bg-teal-600 transition-all flex items-center justify-center gap-2"
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
                <div className="bg-[#40a8ab] p-6 text-center text-white">
                  <h3 className="text-lg font-bold tracking-wide uppercase">
                    CLUB {organizacion.nombre} ¡¡DONAR TIENE PREMIO!!
                  </h3>
                </div>
                
                <div className="p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-extrabold text-slate-800 mb-2">
                      {organizacion.nombre} - CLUB TRIPLE IMPACTO
                    </h2>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      {organizacion.nombre === "PLATO LLENO" ? (
                        "¡Sumate a Club Plato Lleno y sé parte del Triple Impacto! Con tu aporte mensual, nos ayudás a seguir rescatando comida que de otro modo se perdería, y distribuirla entre quienes más lo necesitan. Como agradecimiento por tu compromiso, accedés a la Red de Beneficios del Club Triple Impacto, donde vas a encontrar descuentos exclusivos en tus marcas favoritas."
                      ) : (
                        organizacion.descripcion || `¡Sumate y sé parte del Triple Impacto! Con tu aporte mensual, nos ayudás a sostener proyectos de impacto y como agradecimiento accedés a nuestra red de beneficios y descuentos exclusivos.`
                      )}
                    </p>
                  </div>
                  
                  <div className="bg-teal-50/30 rounded-2xl p-6 border border-teal-100/50 text-center">
                    <p className="text-slate-700 text-sm font-semibold mb-6">
                      Para realizar tu donación de forma segura, seleccioná una de las siguientes opciones:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => router.push(`/login?redirect=/donar/${ongSlug}`)}
                        className="w-full py-4 px-6 bg-[#40a8ab] hover:bg-teal-600 text-white rounded-2xl font-bold transition-all cursor-pointer shadow-md flex items-center justify-between gap-4 group"
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
              {organizacion.logo_url && (
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border border-slate-100 shadow-sm flex items-center justify-center bg-white p-2">
                  <img src={organizacion.logo_url} alt={organizacion.nombre} className="max-w-full max-h-full object-contain" />
                </div>
              )}
              
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
                    <a href={`mailto:${organizacion.email}`} className="text-[#40a8ab] hover:underline break-all">{organizacion.email}</a>
                  </div>
                )}
                {organizacion.telefono && (
                  <div className="flex items-start gap-2.5">
                    <span className="font-semibold text-slate-800">Teléfono:</span>
                    <span className="text-slate-500">{organizacion.telefono}</span>
                  </div>
                )}
              </div>
              
              {organizacion.website_url && (
                <a
                  href={organizacion.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2.5 text-center bg-teal-50 hover:bg-teal-100 text-[#40a8ab] font-bold rounded-2xl text-xs transition-colors"
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
