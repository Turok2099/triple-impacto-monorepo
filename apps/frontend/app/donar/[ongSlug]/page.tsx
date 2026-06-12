"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import PaymentFormExclusive from "@/components/donar/PaymentFormExclusive";
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
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

  // 1. Validar autenticación y redireccionar
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push(`/login?redirect=/donar/${ongSlug}`);
      } else {
        setCheckingAuth(false);
      }
    }
  }, [authLoading, isAuthenticated, router, ongSlug]);

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

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Formulario de donación exclusivo */}
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-350">
          <PaymentFormExclusive
            organizacion={organizacion}
            onSuccess={(data) => console.log('Donación exclusiva exitosa', data)}
          />
        </div>
      </div>
    </div>
  );
}
