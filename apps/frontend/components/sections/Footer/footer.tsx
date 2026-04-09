"use client";

import { useState } from "react";
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Clock,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const Tiktok = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // Newsletter State
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setStatus({ type: null, message: "" });

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
      const res = await fetch(`${baseUrl}/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error al procesar la suscripción.");
      }

      setStatus({ type: "success", message: data.message || "¡Suscripción exitosa!" });
      setEmail("");
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Ocurrió un error." });
    } finally {
      setLoading(false);
      // Timeout para limpiar el mensaje después de 5 segundos
      setTimeout(() => setStatus({ type: null, message: "" }), 5000);
    }
  };

  // Links rápidos
  const quickLinks = [
    { name: "Cómo funciona", url: "#como-funciona" },
    { name: "Beneficios", url: "#beneficios" },
    { name: "Proyectos activos", url: "#proyectos" },
    { name: "Sobre nosotros", url: "#nosotros" },
  ];

  // Redes sociales
  const socialLinks = [
    { name: "Facebook", icon: Facebook, url: "#" },
    {
      name: "Instagram",
      icon: Instagram,
      url: "https://www.instagram.com/ayni.loquedasvuelve?igsh=emZzOGIzd25ldjZz",
    },
    {
      name: "TikTok",
      icon: Tiktok,
      url: "https://www.tiktok.com/@ayni.loquedasvuelve?_r=1&_t=ZS-95NeryvhHBh",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: "https://www.linkedin.com/company/comunidad-club-triple-impacto/posts/?feedView=all",
    },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Sección principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Columna 1: Logo y descripción */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Link href="/">
                <Image
                  src="https://res.cloudinary.com/dxbtafe9u/image/upload/v1775685229/ISOLOGOTIPO_AYNI_FONDO_TRANSPARENTE_iwyuaw.png"
                  alt="AYNI"
                  width={140}
                  height={50}
                  className="object-contain"
                  priority
                />
              </Link>
            </div>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            Transformamos tu generosidad en impacto social y ambiental real real y en beneficios exclusivos. Doná, ayudá y ahorrá.
            </p>
            {/* Redes sociales */}
            <div className="flex gap-3">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800 hover:bg-teal-600 rounded-lg flex items-center justify-center transition-colors duration-200"
                    aria-label={social.name}
                    title={social.name}
                  >
                    <IconComponent className="w-5 h-5 text-white" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Columna 2: ONGs Aliadas */}
          <div>
            <h4 className="text-white font-semibold text-lg mb-4">
              ONGs Aliadas
            </h4>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Conocé todas las organizaciones que forman parte de nuestra comunidad.
            </p>
            <a
              href="/ongs"
              className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors duration-200 font-medium"
            >
              Ver todas las ONGs
              <span>→</span>
            </a>
          </div>

          {/* Columna 4: Contacto */}
          <div>
            <h4 className="text-white font-semibold text-lg mb-4">Contacto</h4>
            <ul className="space-y-4 text-sm mb-6">
              <li className="flex items-start gap-3">
                <Mail className="text-teal-500 w-6 h-6 shrink-0 mt-0.5" />
                <a
                  href="mailto:clubtripleimpacto@gmail.com"
                  className="text-gray-400 hover:text-teal-400 transition-colors"
                >
                  clubtripleimpacto@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="text-teal-500 w-6 h-6 shrink-0 mt-0.5" />
                <a
                  href="https://wa.me/5491156393261"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-teal-400 transition-colors"
                >
                  +54 11 5639-3261 (WhatsApp)
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="text-teal-500 w-6 h-6 shrink-0 mt-0.5" />
                <span className="text-gray-400">
                  Caseros 1213, San Isidro, Buenos Aires
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="text-teal-500 w-6 h-6 shrink-0 mt-0.5" />
                <span className="text-gray-400">Atención 24 horas</span>
              </li>
            </ul>

            <a
              href="/contact"
              className="inline-block px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Formulario de contacto
            </a>

            {/* Newsletter */}
            <div className="mt-6">
              <h5 className="text-white font-medium text-sm mb-3">Newsletter</h5>
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Tu email"
                    required
                    disabled={loading}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                  />
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center shrink-0 w-12"
                  >
                    {loading ? (
                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      "→"
                    )}
                  </button>
                </div>
                {status.type && (
                  <div className={`text-xs px-2 py-1.5 rounded-lg border ${status.type === 'success' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'} animate-in fade-in slide-in-from-top-1`}>
                    {status.message}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Sección inferior */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="text-sm text-gray-400 text-center md:text-left">
              © {currentYear} AYNI. Todos los derechos
              reservados.
            </div>

            {/* Links legales */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <a
                href="#terminos"
                className="text-gray-400 hover:text-teal-400 transition-colors"
              >
                Términos y condiciones
              </a>
              <a
                href="#privacidad"
                className="text-gray-400 hover:text-teal-400 transition-colors"
              >
                Política de privacidad
              </a>
              <a
                href="#cookies"
                className="text-gray-400 hover:text-teal-400 transition-colors"
              >
                Política de cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
