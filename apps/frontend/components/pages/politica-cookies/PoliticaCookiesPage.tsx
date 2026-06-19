"use client";

import { Cookie, ShieldAlert, CheckCircle2, Sliders, ExternalLink } from "lucide-react";

export default function PoliticaCookiesPage() {
  const handleOpenPreferences = () => {
    // Dispatch custom event to open the banner
    window.dispatchEvent(new CustomEvent("ayni-open-cookie-preferences"));
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Encabezado */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-50 text-[#40a8ab] rounded-2xl mb-4">
            <Cookie className="w-10 h-10" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Política de Cookies
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            Última actualización: Junio 2026
          </p>
        </div>

        {/* Panel de control de preferencias rápido */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-xl p-6 sm:p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#40a8ab]" />
              Configuración de tu Consentimiento
            </h2>
            <p className="text-sm text-gray-600">
              Podés modificar las cookies que permitís en AYNI en cualquier momento. Al hacer clic en el botón de la derecha, se abrirá el panel de control.
            </p>
          </div>
          <button
            onClick={handleOpenPreferences}
            className="w-full md:w-auto px-6 py-3 bg-[#40a8ab] hover:bg-[#2c8184] text-white font-semibold rounded-xl shadow-md transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Cambiar preferencias</span>
          </button>
        </div>

        {/* Contenido de la política */}
        <div className="prose prose-teal max-w-none text-gray-700 space-y-8">
          
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
              1. ¿Qué son las cookies?
            </h3>
            <p className="text-sm leading-relaxed text-gray-600">
              Las cookies son pequeños archivos de texto que los sitios web que visitás almacenan en tu dispositivo (computadora, tablet o smartphone). Se utilizan ampliamente para que los sitios web funcionen de manera más eficiente, mejorar tu experiencia de navegación, y proporcionar información analítica a los propietarios del sitio.
            </p>
          </section>

          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
              2. ¿Cómo y por qué utilizamos cookies en AYNI?
            </h3>
            <p className="text-sm leading-relaxed text-gray-600 mb-4">
              En AYNI utilizamos cookies por razones técnicas, analíticas y de personalización de beneficios. Nos permiten reconocerte cuando iniciás sesión, asegurar que tus donaciones se procesen correctamente y ofrecerte cupones de descuentos de Bonda ajustados a tu perfil.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-50">
                <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  Técnicas / Esenciales
                </h4>
                <p className="text-xs text-gray-600 leading-normal">
                  Mantienen tu sesión activa, resguardan la seguridad de la navegación y gestionan el flujo de donaciones e integraciones de pago de Fiserv de forma segura.
                </p>
              </div>
              <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-50">
                <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  Rendimiento y Métricas
                </h4>
                <p className="text-xs text-gray-600 leading-normal">
                  Miden la interacción en la plataforma de forma anónima (usando Vercel Speed Insights y Google Analytics) para mejorar el rendimiento técnico del sitio.
                </p>
              </div>
              <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-50">
                <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  Marketing y Descuentos
                </h4>
                <p className="text-xs text-gray-600 leading-normal">
                  Vinculan de forma optimizada tu perfil con el club de beneficios de Bonda y nos ayudan a mostrarte campañas e incentivos de donación pertinentes.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm overflow-hidden">
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
              3. Detalle de las Cookies que utilizamos
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 font-semibold text-gray-900 rounded-l-lg">Cookie / Origen</th>
                    <th className="px-4 py-3 font-semibold text-gray-900">Categoría</th>
                    <th className="px-4 py-3 font-semibold text-gray-900">Propósito</th>
                    <th className="px-4 py-3 font-semibold text-gray-900 rounded-r-lg">Duración</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">`ayni-auth-token`</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 text-[10px] font-medium">Esencial</span></td>
                    <td className="px-4 py-3 text-gray-600">Mantiene activa la sesión de tu cuenta de forma segura.</td>
                    <td className="px-4 py-3 text-gray-600">30 días</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">`ayni-cookie-consent`</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 text-[10px] font-medium">Esencial</span></td>
                    <td className="px-4 py-3 text-gray-600">Guarda tu configuración de consentimiento de cookies.</td>
                    <td className="px-4 py-3 text-gray-600">1 año</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">`_ga` / Google Analytics</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-medium">Analítica</span></td>
                    <td className="px-4 py-3 text-gray-600">Monitorea y genera estadísticas anónimas de navegación por la plataforma.</td>
                    <td className="px-4 py-3 text-gray-600">2 años</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">`_vercel_insights`</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-medium">Analítica</span></td>
                    <td className="px-4 py-3 text-gray-600">Mide el rendimiento de velocidad del sitio y optimiza la navegación.</td>
                    <td className="px-4 py-3 text-gray-600">Sesión</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">Bonda (Cupones)</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-medium">Marketing</span></td>
                    <td className="px-4 py-3 text-gray-600">Permite la vinculación y asignación de tus beneficios y cupones de descuento exclusivos.</td>
                    <td className="px-4 py-3 text-gray-600">Variable</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
              4. ¿Cómo controlar las cookies desde tu navegador?
            </h3>
            <p className="text-sm leading-relaxed text-gray-600 mb-4">
              La mayoría de los navegadores te permiten bloquear o borrar las cookies a través de su panel de configuración. Tené en cuenta que si bloqueás las cookies indispensables para el funcionamiento del sitio, algunas funciones y secciones podrían dejar de responder adecuadamente.
            </p>
            <p className="text-sm leading-relaxed text-gray-600 mb-4">
              Acá podés encontrar guías sobre cómo hacerlo en los navegadores principales:
            </p>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-[#40a8ab] shrink-0" />
                <a
                  href="https://support.google.com/chrome/answer/95647?hl=es"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#40a8ab] hover:underline font-medium flex items-center gap-1"
                >
                  Google Chrome
                </a>
              </li>
              <li className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-[#40a8ab] shrink-0" />
                <a
                  href="https://support.apple.com/es-es/guide/safari/sfri11471/mac"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#40a8ab] hover:underline font-medium flex items-center gap-1"
                >
                  Apple Safari
                </a>
              </li>
              <li className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-[#40a8ab] shrink-0" />
                <a
                  href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#40a8ab] hover:underline font-medium flex items-center gap-1"
                >
                  Mozilla Firefox
                </a>
              </li>
              <li className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-[#40a8ab] shrink-0" />
                <a
                  href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63fd9a15-d993-49d7-8c9a-4b68b8e62817"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#40a8ab] hover:underline font-medium flex items-center gap-1"
                >
                  Microsoft Edge
                </a>
              </li>
            </ul>
          </section>

          <section className="bg-orange-50 border border-orange-100 rounded-2xl p-6 sm:p-8 flex items-start gap-4">
            <ShieldAlert className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-gray-900 text-sm mb-1">Contacto</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Si tenés dudas o querés realizar alguna consulta sobre el manejo de tus datos de navegación, escribinos a{" "}
                <a href="mailto:contacto@ayni.ar" className="text-[#40a8ab] hover:underline font-medium">
                  contacto@ayni.ar
                </a>
                . Estaremos encantados de ayudarte.
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
