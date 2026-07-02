"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { login: loginContext } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // 1. Obtener la sesión desde el hash de la URL (Supabase lo hace automáticamente)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        if (!session) {
          throw new Error("No se encontró sesión activa.");
        }

        const token = session.access_token;
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

        // 2. Comprobar si el usuario ya está en public.usuarios (perfil completo)
        const response = await fetch(`${API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          // Usuario sincronizado, loguear e ir al dashboard
          loginContext(token, data.user);
          router.push("/dashboard");
        } else if (response.status === 401) {
          // El token es válido pero validateUser falló -> No existe en public.usuarios (falta DNI)
          router.push("/completar-perfil");
        } else {
          throw new Error("Error inesperado al consultar perfil.");
        }
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setError(err.message || "Ocurrió un error en la autenticación.");
        setTimeout(() => router.push("/login"), 3000);
      }
    };

    handleAuth();
  }, [router, loginContext]);

  return (
    <div className="min-h-screen bg-[#f4fafb] flex flex-col items-center justify-center p-4">
      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-center max-w-sm">
          <p className="font-bold mb-1">Error de Autenticación</p>
          <p className="text-sm">{error}</p>
          <p className="text-sm mt-3 opacity-80">Redirigiendo a Login...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-[#2c8184] animate-spin mb-4" />
          <h2 className="text-xl font-bold text-gray-700">Autenticando...</h2>
          <p className="text-sm text-gray-500 mt-2">Por favor, espera un momento.</p>
        </div>
      )}
    </div>
  );
}
