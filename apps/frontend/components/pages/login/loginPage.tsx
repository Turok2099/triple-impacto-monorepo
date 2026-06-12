"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, AlertCircle, Mail, KeyRound } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export default function LoginPage() {
  const { login: loginContext } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

  // Verificar si venimos de algún proceso de Auth
  useEffect(() => {
    // 1. Guardar intención de redirección si existe
    const params = new URLSearchParams(window.location.search);
    const redirectUrl = params.get("redirect");
    if (redirectUrl) {
      localStorage.setItem("redirectAfterLogin", redirectUrl);
    }

    // 2. Parámetros de URL para Verificación de Correo
    if (params.get("check_email") === "true") {
      setSuccessMsg("¡Cuenta creada! Revisa tu bandeja de entrada o SPAM para confirmar tu correo antes de iniciar sesión.");
    } else if (params.get("verified") === "true") {
      setSuccessMsg("¡Tu correo ha sido verificado con éxito! Ya podés iniciar sesión normalmente.");
    } else if (params.get("success") === "password_reset") {
      setSuccessMsg("¡Tu contraseña ha sido actualizada exitosamente! Iniciá sesión con tu nueva clave.");
    } else if (params.get("error") === "invalid_token") {
      setError("El enlace es inválido o expiró. Intenta nuevamente o contactá a soporte.");
    }

    // Limpiar la URL para que no persista si recargan la página
    if (params.get("check_email") || params.get("verified") || params.get("success") || params.get("error")) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleResendVerification = async () => {
    if (!email) {
      setError("Por favor, ingresá tu correo electrónico en el formulario antes de solicitar un nuevo enlace.");
      return;
    }
    setResendLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error al reenviar el correo.");
      }
      setSuccessMsg(data.message || "Te hemos enviado un nuevo enlace. Revisa tu bandeja de entrada o SPAM.");
      setError(null);
    } catch (err: any) {
      setError(err.message || "Ocurrió un problema al intentar reenviar el enlace.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Enviar credenciales al backend
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Credenciales incorrectas");
      }

      // Usar el contexto de autenticación
      loginContext(data.token, data.user);

      // Si "Recordarme" está activado, guardar email
      if (rememberMe) {
        localStorage.setItem("remembered_email", email);
      } else {
        localStorage.removeItem("remembered_email");
      }

      // Redirigir al dashboard o página previa
      const params = new URLSearchParams(window.location.search);
      let redirectUrl = params.get("redirect");
      
      if (!redirectUrl) {
        const localRedirect = localStorage.getItem("redirectAfterLogin");
        if (localRedirect) {
          redirectUrl = localRedirect;
        }
      }

      if (redirectUrl) {
        localStorage.removeItem("redirectAfterLogin");
      } else {
        redirectUrl = "/dashboard";
      }

      window.location.href = redirectUrl;
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión. Verifica tus credenciales.");
      console.error("Error en login:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-teal-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo y Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenido de nuevo
          </h2>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-xl p-8">


          {/* Mensaje de error */}
          {error && (
            <div className="mb-6 bg-red-50/80 border border-red-200/60 shadow-sm rounded-xl p-4 transition-all animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-start gap-4">
                <div className="bg-red-100/80 p-2 rounded-full shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="pt-0.5 w-full">
                  <p className="text-sm font-bold text-red-900 mb-1 tracking-tight">
                    Ocurrió un problema
                  </p>
                  <p className="text-sm text-red-800 leading-relaxed font-medium">
                    {error}
                  </p>
                  {(error.includes("confirmar tu correo") || error.includes("Debes confirmar")) && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendLoading}
                      className="mt-3 text-sm font-semibold text-teal-700 hover:text-teal-800 underline underline-offset-2 transition-colors disabled:opacity-50"
                    >
                      {resendLoading ? "Enviando enlace..." : "¿No recibiste o perdiste el correo? Reenviar enlace"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mensaje de validación o check Email */}
          {successMsg && (
            <div className="mb-6 bg-teal-50/80 border border-teal-200/60 shadow-sm rounded-xl p-4 transition-all animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-start gap-4">
                <div className="bg-teal-100/80 p-2 rounded-full shrink-0">
                  {successMsg.includes("etapa de verificación") || successMsg.includes("correo") ? (
                    <Mail className="w-5 h-5 text-[#40a8ab]" />
                  ) : successMsg.includes("contraseña") ? (
                    <KeyRound className="w-5 h-5 text-[#40a8ab]" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-[#40a8ab]" />
                  )}
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-bold text-teal-900 mb-1 tracking-tight">
                    Completado con éxito
                  </p>
                  <p className="text-sm text-teal-800 leading-relaxed font-medium">
                    {successMsg}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Correo electrónico
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

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 pr-20 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 hover:text-gray-700"
                  disabled={loading}
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            {/* Remember me y Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#40a8ab] focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700 cursor-pointer"
                >
                  Recordarme
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="/forgot-password"
                  className="font-medium text-[#40a8ab] hover:text-[#40a8ab] transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-linear-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  O continuar con
                </span>
              </div>
            </div>

            {/* Social Login */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span className="text-xl">G</span>
                Google
              </button>
              <button
                type="button"
                className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span className="text-xl">f</span>
                Facebook
              </button>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            ¿No tenés cuenta?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                const params = new URLSearchParams(window.location.search);
                const redirectUrl = params.get("redirect");
                window.location.href = redirectUrl ? `/registro?redirect=${encodeURIComponent(redirectUrl)}` : "/registro";
              }}
              className="font-semibold text-[#40a8ab] hover:text-[#40a8ab] transition-colors"
            >
              Regístrate gratis
            </a>
          </p>
        </div>




      </div>
    </div>
  );
}
