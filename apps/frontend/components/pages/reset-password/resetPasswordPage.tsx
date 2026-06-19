"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export default function ResetPasswordPage() {
  // En Next.js App Router, usar useSearchParams requiere que la página esté en un Suspense boundary 
  // o asegurarse de hacerlo con client side rendering absoluto. Aquí extraemos manual para simplificar on mount.
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      setToken(urlToken);
    } else {
      setError("No se brindó un token de seguridad válido. Por favor, regresa a tu correo y hacé clic en el botón.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Token ausente. Vuelve a hacer clic en el enlace de tu correo.");
      return;
    }

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden. Verificalas e intentá de nuevo.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al actualizar la contraseña");
      }

      setSuccess(true);

      setTimeout(() => {
        window.location.href = "/login?success=password_reset";
      }, 3500);

    } catch (err: any) {
      setError(err.message || "Hubo un error al intentar guardar tu nueva contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-linear-to-br from-teal-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Elegí tu nueva clave
          </h2>
          <p className="text-gray-600">
            Asegurate de usar algo secreto y recordable
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 bg-red-50/80 border border-red-200/60 shadow-sm rounded-xl p-4 transition-all animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-start gap-4">
                <div className="bg-red-100/80 p-2 rounded-full shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-bold text-red-900 mb-1 tracking-tight">
                    Ocurrió un problema
                  </p>
                  <p className="text-sm text-red-800 leading-relaxed font-medium">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-teal-50/80 border border-teal-200/60 shadow-sm rounded-xl p-4 transition-all animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-start gap-4">
                <div className="bg-teal-100/80 p-2 rounded-full shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-[#2c8184]" />
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-bold text-teal-900 mb-1 tracking-tight">
                    ¡Listo!
                  </p>
                  <p className="text-sm text-teal-800 leading-relaxed font-medium">
                    Tu contraseña se actualizó con éxito. Redirigiendo...
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  disabled={loading || success || !token}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  disabled={loading || success || !token}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success || !token}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-linear-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Guardando..." : "Guardar contraseña"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
