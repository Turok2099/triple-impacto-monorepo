"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export default function RegisterPage() {
  const { login: loginContext } = useAuth();
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
    telefono: "",
    provincia: "",
    localidad: "",
    aceptaTerminos: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const provincias = [
    "Buenos Aires",
    "CABA",
    "Catamarca",
    "Chaco",
    "Chubut",
    "Córdoba",
    "Corrientes",
    "Entre Ríos",
    "Formosa",
    "Jujuy",
    "La Pampa",
    "La Rioja",
    "Mendoza",
    "Misiones",
    "Neuquén",
    "Río Negro",
    "Salta",
    "San Juan",
    "San Luis",
    "Santa Cruz",
    "Santa Fe",
    "Santiago del Estero",
    "Tierra del Fuego",
    "Tucumán",
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    // Validar longitud de contraseña
    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      setLoading(false);
      return;
    }

    try {
      // Enviar datos al backend
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          password: formData.password,
          telefono: formData.telefono,
          provincia: formData.provincia,
          localidad: formData.localidad,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al crear la cuenta");
      }

      // Usar el contexto de autenticación
      loginContext(data.token, data.user);

      // Mostrar éxito
      setSuccess(true);

      // Redirigir al dashboard o home después de 2 segundos
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Error al crear la cuenta. Por favor, intenta nuevamente.");
      console.error("Error en registro:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Logo y Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Creá tu cuenta
          </h2>
          <p className="text-gray-600">
            Unite a Club Triple Impacto y comenzá a generar cambio
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Mensaje de error */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Mensaje de éxito */}
          {success && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-sm text-emerald-800">
                ¡Cuenta creada exitosamente! Redirigiendo...
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre completo */}
            <div>
              <label
                htmlFor="nombre"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nombre completo *
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                value={formData.nombre}
                onChange={handleChange}
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Juan Pérez"
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Correo electrónico *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="tu@email.com"
                disabled={loading}
              />
            </div>

            {/* Teléfono */}
            <div>
              <label
                htmlFor="telefono"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Teléfono *
              </label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                required
                value={formData.telefono}
                onChange={handleChange}
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="+54 9 11 1234-5678"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Incluí código de área sin 0 (Ej: 11 para CABA)
              </p>
            </div>

            {/* Provincia y Localidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Provincia */}
              <div>
                <label
                  htmlFor="provincia"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Provincia *
                </label>
                <select
                  id="provincia"
                  name="provincia"
                  required
                  value={formData.provincia}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
                  disabled={loading}
                >
                  <option value="">Seleccioná una provincia</option>
                  {provincias.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              {/* Localidad */}
              <div>
                <label
                  htmlFor="localidad"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Localidad *
                </label>
                <input
                  id="localidad"
                  name="localidad"
                  type="text"
                  required
                  value={formData.localidad}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="Tu ciudad"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Contraseña *
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full px-4 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
              <p className="mt-1 text-xs text-gray-500">
                Mínimo 8 caracteres, incluí letras y números
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirmar contraseña *
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full px-4 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 hover:text-gray-700"
                  disabled={loading}
                >
                  {showConfirmPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            {/* Términos y condiciones */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="aceptaTerminos"
                  name="aceptaTerminos"
                  type="checkbox"
                  required
                  checked={formData.aceptaTerminos}
                  onChange={handleChange}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
                />
              </div>
              <div className="ml-3">
                <label
                  htmlFor="aceptaTerminos"
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  Acepto los{" "}
                  <a
                    href="/terminos"
                    className="text-emerald-600 hover:text-emerald-500 font-medium"
                    target="_blank"
                  >
                    Términos y Condiciones
                  </a>{" "}
                  y la{" "}
                  <a
                    href="/privacidad"
                    className="text-emerald-600 hover:text-emerald-500 font-medium"
                    target="_blank"
                  >
                    Política de Privacidad
                  </a>
                  *
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
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
                  O regístrate con
                </span>
              </div>
            </div>

            {/* Social Register */}
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

        {/* Login link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ¿Ya tienes cuenta?{" "}
            <a
              href="/login"
              className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors"
            >
              Iniciá sesión
            </a>
          </p>
        </div>

        {/* Benefits reminder */}
        <div className="mt-6 bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
          <h3 className="text-sm font-semibold text-emerald-900 mb-3">
            Al registrarte obtienes:
          </h3>
          <ul className="space-y-2 text-sm text-emerald-800">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 shrink-0">✓</span>
              <span>Acceso a descuentos exclusivos de Bonda</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 shrink-0">✓</span>
              <span>Dashboard personal para gestionar donaciones</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 shrink-0">✓</span>
              <span>Reportes de impacto de tus aportes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 shrink-0">✓</span>
              <span>Certificados de donación para deducir impuestos</span>
            </li>
          </ul>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors inline-flex items-center gap-2"
          >
            <span>←</span>
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
