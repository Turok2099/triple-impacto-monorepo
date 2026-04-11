"use client";

import { useState } from "react";
import { Mail, AlertCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al solicitar la recuperación");
      }

      setSuccessMsg(data.message || "Te hemos enviado un enlace de recuperación. Revisa tu bandeja de entrada o SPAM.");
      setEmail("");
    } catch (err: any) {
      setError(err.message || "Hubo un error de conexión al intentar recuperar la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-linear-to-br from-teal-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Recuperá tu acceso
          </h2>
          <p className="text-gray-600">
            Ingresá tu correo y te enviaremos instrucciones
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

          {successMsg && (
            <div className="mb-6 bg-teal-50/80 border border-teal-200/60 shadow-sm rounded-xl p-4 transition-all animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-start gap-4">
                <div className="bg-teal-100/80 p-2 rounded-full shrink-0">
                  <Mail className="w-5 h-5 text-[#40a8ab]" />
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-bold text-teal-900 mb-1 tracking-tight">
                    Solicitud recibida
                  </p>
                  <p className="text-sm text-teal-800 leading-relaxed font-medium">
                    {successMsg}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico asociado
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="tu@email.com"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-linear-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Enviando enlace..." : "Enviar enlace mágico"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
