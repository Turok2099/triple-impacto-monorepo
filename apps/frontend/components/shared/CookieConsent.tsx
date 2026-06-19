"use client";

import { useState, useEffect } from "react";
import { Cookie, Settings, Shield, ChevronDown, ChevronUp, Check } from "lucide-react";
import Link from "next/link";

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: true,
    marketing: true,
  });

  useEffect(() => {
    setMounted(true);
    const consent = localStorage.getItem("ayni-cookie-consent");
    if (!consent) {
      // Delay slightly for entry animation transition
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    } else {
      try {
        const parsed = JSON.parse(consent);
        setPreferences(parsed);
      } catch (e) {
        console.error("Error reading cookie consent", e);
        setIsVisible(true);
      }
    }
  }, []);

  // Listen to custom event to reopen preferences from the policy page or footer
  useEffect(() => {
    if (!mounted) return;
    
    const handleReopen = () => {
      setShowPreferences(true);
      setIsVisible(true);
    };

    window.addEventListener("ayni-open-cookie-preferences", handleReopen);
    return () => {
      window.removeEventListener("ayni-open-cookie-preferences", handleReopen);
    };
  }, [mounted]);

  if (!mounted || !isVisible) return null;

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem("ayni-cookie-consent", JSON.stringify(prefs));
    setPreferences(prefs);
    setIsVisible(false);
    
    // Dispatch custom event for analytical scripts to know consent was updated
    window.dispatchEvent(new CustomEvent("ayni-cookie-consent-updated", { detail: prefs }));
  };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
    });
  };

  const handleDeclineAll = () => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
    });
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === "essential") return; // Essential cannot be disabled
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-[440px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-gray-100 p-6 z-50 transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-8">
      <div className="flex items-start gap-4 mb-4">
        <div className="shrink-0 w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-[#2c8184]">
          <Cookie className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-base flex items-center gap-1.5">
            Valoramos tu privacidad
          </h3>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
            Utilizamos cookies para optimizar tu experiencia en AYNI, analizar el tráfico y personalizar los beneficios. Podés configurar tus preferencias en cualquier momento.
          </p>
        </div>
      </div>

      {/* Panel de Preferencias Expandido */}
      {showPreferences ? (
        <div className="border-t border-b border-gray-100 py-4 my-4 space-y-4 max-h-[220px] overflow-y-auto pr-1">
          {/* Esenciales */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-800">Esenciales</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[9px] font-medium uppercase">
                  Siempre activas
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-normal">
                Necesarias para que el sitio funcione correctamente (sesión de usuario, seguridad y transacciones).
              </p>
            </div>
            <div className="relative inline-flex items-center cursor-not-allowed">
              <input
                type="checkbox"
                checked={true}
                disabled
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-teal-500 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
            </div>
          </div>

          {/* Analíticas */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <span className="text-xs font-semibold text-gray-800">Rendimiento y Métricas</span>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-normal">
                Nos permiten medir las visitas, de dónde provienen y entender qué secciones del sitio podemos mejorar.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={() => togglePreference("analytics")}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2c8184]"></div>
            </label>
          </div>

          {/* Marketing */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <span className="text-xs font-semibold text-gray-800">Marketing y Personalización</span>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-normal">
                Utilizadas para ofrecerte cupones de descuentos y beneficios más relevantes para vos según tus intereses.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.marketing}
                onChange={() => togglePreference("marketing")}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2c8184]"></div>
            </label>
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-500 mb-4 flex items-center gap-1">
          <span>Consultá nuestra</span>
          <Link href="/politica-de-cookies" className="text-[#2c8184] hover:underline font-medium">
            Política de cookies
          </Link>
        </div>
      )}

      {/* Botonera */}
      <div className="space-y-2 mt-4">
        {showPreferences ? (
          <div className="flex gap-2">
            <button
              onClick={() => setShowPreferences(false)}
              className="flex-1 py-2 px-3 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Volver
            </button>
            <button
              onClick={handleSavePreferences}
              className="flex-1 py-2 px-3 bg-[#2c8184] hover:bg-[#1e6063] text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Guardar selección
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPreferences(true)}
                className="flex-1 py-2.5 px-3 border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5" />
                Configurar
              </button>
              <button
                onClick={handleDeclineAll}
                className="flex-1 py-2.5 px-3 border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Solo esenciales
              </button>
            </div>
            <button
              onClick={handleAcceptAll}
              className="w-full py-2.5 px-4 bg-[#2c8184] hover:bg-[#1e6063] text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-colors"
            >
              Aceptar todo
            </button>
          </>
        )}
      </div>
    </div>
  );
}
