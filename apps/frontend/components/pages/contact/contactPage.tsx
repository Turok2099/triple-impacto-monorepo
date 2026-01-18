"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    asunto: "",
    mensaje: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica de envío
    console.log("Contacto:", formData);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-gray-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Hablemos
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            ¿Tienes dudas o quieres saber más? Estamos aquí para ayudarte
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Información de contacto */}
          <div>
            {/* Cards de contacto */}
            <div className="space-y-6 mb-8">
              {/* Email */}
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                    <a
                      href="mailto:clubtripleimpacto@gmail.com"
                      className="text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      clubtripleimpacto@gmail.com
                    </a>
                    <p className="text-sm text-gray-600 mt-1">
                      Atención 24 horas
                    </p>
                  </div>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      WhatsApp
                    </h3>
                    <a
                      href="https://wa.me/5491156393261"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 transition-colors"
                    >
                      +54 11 5639-3261
                    </a>
                    <p className="text-sm text-gray-600 mt-1">
                      Disponible 24 horas
                    </p>
                  </div>
                </div>
              </div>

              {/* Ubicación */}
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Ubicación
                    </h3>
                    <p className="text-gray-600">Caseros 1213</p>
                    <p className="text-gray-600">San Isidro, Buenos Aires</p>
                    <p className="text-sm text-gray-600 mt-1">Argentina</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preguntas frecuentes */}
            <div className="bg-linear-to-br from-emerald-500 to-blue-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">¿Tienes dudas rápidas?</h3>
              <p className="text-emerald-50 mb-6">
                Consulta nuestra sección de preguntas frecuentes antes de
                escribirnos.
              </p>
              <a
                href="/#preguntas"
                className="inline-block px-6 py-3 bg-white text-emerald-700 font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                Ver FAQ
              </a>
            </div>
          </div>

          {/* Formulario de contacto */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Envíanos un mensaje
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre */}
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
                  placeholder="Tu nombre"
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
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="tu@email.com"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label
                  htmlFor="telefono"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Teléfono
                </label>
                <input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="+54 9 11 1234-5678"
                />
              </div>

              {/* Asunto */}
              <div>
                <label
                  htmlFor="asunto"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Asunto *
                </label>
                <select
                  id="asunto"
                  name="asunto"
                  required
                  value={formData.asunto}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
                >
                  <option value="">Selecciona un asunto</option>
                  <option value="donacion">Consulta sobre donaciones</option>
                  <option value="beneficios">Consulta sobre beneficios</option>
                  <option value="ongs">Alianza con ONG</option>
                  <option value="empresa">Alianza empresarial</option>
                  <option value="tecnico">Soporte técnico</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              {/* Mensaje */}
              <div>
                <label
                  htmlFor="mensaje"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Mensaje *
                </label>
                <textarea
                  id="mensaje"
                  name="mensaje"
                  rows={5}
                  required
                  value={formData.mensaje}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                  placeholder="Cuéntanos en qué podemos ayudarte..."
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <Send className="w-5 h-5" />
                <span>Enviar mensaje</span>
              </button>
            </form>

            <p className="mt-4 text-sm text-gray-500 text-center">
              Al enviar este formulario, aceptas nuestra{" "}
              <a
                href="/privacidad"
                className="text-emerald-600 hover:text-emerald-700"
              >
                Política de Privacidad
              </a>
            </p>
          </div>
        </div>

        {/* Horarios de atención */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Horarios de atención
          </h3>
          <div className="max-w-md mx-auto text-center p-6 bg-linear-to-br from-emerald-50 to-blue-50 rounded-xl">
            <div className="text-5xl mb-4">🕐</div>
            <h4 className="text-2xl font-bold text-gray-900 mb-2">
              Disponibles 24 horas
            </h4>
            <p className="text-gray-600 mb-2">
              Atención continua vía WhatsApp y Email
            </p>
            <p className="text-emerald-600 font-medium">
              Los 7 días de la semana
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
