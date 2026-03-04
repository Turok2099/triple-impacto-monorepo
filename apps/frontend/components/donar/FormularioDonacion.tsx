"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Gift, Lock, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  obtenerOrganizaciones,
  formatearMonto,
  validarMonto,
  type Organizacion,
} from "@/lib/payments";
import { getOrganizationLogoUrl } from "@/lib/organization-logos";

interface FormularioDonacionProps {
  onSubmit: (monto: number, organizacionId?: string) => void;
  loading?: boolean;
}

// Montos sugeridos predefinidos (mínimo: $5000 ARS)
const MONTOS_SUGERIDOS = [5000, 10000, 15000];
const MONTO_MINIMO = 5000;

export default function FormularioDonacion({
  onSubmit,
  loading = false,
}: FormularioDonacionProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [errorOrgs, setErrorOrgs] = useState<string | null>(null);

  const [montoSeleccionado, setMontoSeleccionado] = useState<number | null>(
    5000
  );
  const [montoCustom, setMontoCustom] = useState("");
  const [usarMontoCustom, setUsarMontoCustom] = useState(false);
  const [organizacionId, setOrganizacionId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const organizacionSeleccionada = organizaciones.find(
    (org) => org.id === organizacionId
  );

  // DEBUG: Verificar estado de autenticación
  useEffect(() => {
    console.log("🔐 Estado Auth:", {
      user,
      isLoading: authLoading,
      hasToken: !!localStorage.getItem("auth_token"),
      hasUserData: !!localStorage.getItem("user"),
    });
  }, [user, authLoading]);

  // Cargar organizaciones al montar
  useEffect(() => {
    cargarOrganizaciones();
  }, []);

  const cargarOrganizaciones = async () => {
    try {
      setLoadingOrgs(true);
      setErrorOrgs(null);
      const orgs = await obtenerOrganizaciones();
      setOrganizaciones(orgs);

      // Seleccionar la primera organización por defecto
      if (orgs.length > 0) {
        setOrganizacionId(orgs[0].id);
      }
    } catch (err: any) {
      setErrorOrgs(err.message || "Error al cargar organizaciones");
    } finally {
      setLoadingOrgs(false);
    }
  };

  const handleMontoSugeridoClick = (monto: number) => {
    // Validar monto mínimo
    if (monto < MONTO_MINIMO) {
      setError(`El monto mínimo para donar es ${formatearMonto(MONTO_MINIMO)}`);
      return;
    }
    setMontoSeleccionado(monto);
    setUsarMontoCustom(false);
    setMontoCustom("");
    setError(null);
  };

  const handleMontoCustomChange = (value: string) => {
    setMontoCustom(value);
    setUsarMontoCustom(true);
    setMontoSeleccionado(null);

    // Validar monto mínimo en tiempo real
    const monto = parseFloat(value);
    if (!isNaN(monto) && monto > 0 && monto < MONTO_MINIMO) {
      setError(`El monto mínimo para donar es ${formatearMonto(MONTO_MINIMO)}`);
    } else {
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Determinar el monto final
    const montoFinal = usarMontoCustom
      ? parseFloat(montoCustom)
      : montoSeleccionado || 0;

    // Validar monto mínimo global
    if (montoFinal < MONTO_MINIMO) {
      setError(`El monto mínimo para donar es ${formatearMonto(MONTO_MINIMO)}`);
      return;
    }

    // Validar monto mínimo de la organización (si es mayor)
    const errorMonto = validarMonto(
      montoFinal,
      organizacionSeleccionada?.monto_minimo
    );

    if (errorMonto) {
      setError(errorMonto);
      return;
    }

    // Enviar al componente padre
    onSubmit(montoFinal, organizacionId || undefined);
  };

  // Mostrar loading mientras verifica autenticación
  if (authLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Verificando sesión...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800 mb-4">
          Debes iniciar sesión para realizar una donación
        </p>
        <a
          href="/login"
          className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Iniciar Sesión
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Selección de Organización */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ¿A qué organización querés donar? *
        </label>

        {loadingOrgs ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          </div>
        ) : errorOrgs ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{errorOrgs}</p>
            <button
              type="button"
              onClick={cargarOrganizaciones}
              className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            {/* Select Dropdown */}
            <select
              value={organizacionId}
              onChange={(e) => setOrganizacionId(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
              required
            >
              <option value="" disabled>
                Seleccioná una organización
              </option>
              {organizaciones.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.nombre}
                </option>
              ))}
            </select>

            {/* Información de la organización seleccionada */}
            {organizacionSeleccionada && (() => {
              const logoUrl = getOrganizationLogoUrl(organizacionSeleccionada.nombre);
              return (
              <div className="mt-4 p-5 bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col md:flex-row items-center gap-5 text-center md:text-left transition-all">
                <div className="relative w-36 h-36 overflow-hidden shrink-0 flex items-center justify-center">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt={organizacionSeleccionada.nombre}
                      fill
                      className="object-contain object-center"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-emerald-600 text-4xl font-bold"
                      aria-hidden
                    >
                      {organizacionSeleccionada.nombre.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 text-lg mb-1">
                    {organizacionSeleccionada.nombre}
                  </h4>
                  {organizacionSeleccionada.descripcion && (
                    <p className="text-sm text-slate-600 line-clamp-3">
                      {organizacionSeleccionada.descripcion}
                    </p>
                  )}
                </div>
              </div>
              );
            })()}
          </>
        )}
      </div>

      {/* Selección de Monto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ¿Cuánto querés donar? *
        </label>

        {/* Montos sugeridos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {MONTOS_SUGERIDOS.map((monto) => (
            <button
              key={monto}
              type="button"
              onClick={() => handleMontoSugeridoClick(monto)}
              className={`py-3 px-4 rounded-lg font-medium text-center transition-all ${montoSeleccionado === monto && !usarMontoCustom
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              {formatearMonto(monto)}
            </button>
          ))}

          <button
            type="button"
            onClick={() => {
              setUsarMontoCustom(true);
              setMontoSeleccionado(null);
            }}
            className={`py-3 px-4 rounded-lg font-bold text-center transition-all ${usarMontoCustom
              ? "bg-[#16a459] text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
          >
            Donar +
          </button>
        </div>

        {/* Monto personalizado */}
        {usarMontoCustom && (
          <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                $
              </span>
              <input
                type="number"
                min={MONTO_MINIMO}
                step="1"
                value={montoCustom}
                onChange={(e) => handleMontoCustomChange(e.target.value)}
                placeholder={MONTO_MINIMO.toString()}
                autoFocus
                className="w-full pl-8 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 border-purple-600 focus:ring-purple-600"
              />
            </div>
          </div>
        )}

        {/* Mostrar monto mínimo de organización si es mayor */}
        {organizacionSeleccionada?.monto_minimo &&
          organizacionSeleccionada.monto_minimo > MONTO_MINIMO && (
            <p className="text-sm text-orange-600 font-medium mt-1">
              * Esta organización requiere un monto mínimo explícito de{" "}
              {formatearMonto(organizacionSeleccionada.monto_minimo)}
            </p>
          )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Resumen */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
        <h3 className="font-bold text-gray-900 mb-3">Resumen de tu donación</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Monto:</span>
            <span className="font-bold text-gray-900">
              {formatearMonto(
                usarMontoCustom
                  ? parseFloat(montoCustom) || 0
                  : montoSeleccionado || 0
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Organización:</span>
            <span className="font-medium text-gray-900">
              {organizacionSeleccionada?.nombre || "Seleccionar"}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-purple-200">
          <div className="flex items-start gap-3 text-sm text-purple-800">
            <Gift className="w-5 h-5 flex-shrink-0 mt-0.5 text-purple-600" />
            <p>
              Al donar, obtendrás acceso exclusivo a cupones de descuento de
              Bonda en marcas reconocidas.
            </p>
          </div>
        </div>
      </div>

      {/* Botón de envío */}
      <button
        type="submit"
        disabled={loading || loadingOrgs || !organizacionId}
        className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Procesando...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" /> Proceder al Pago
          </>
        )}
      </button>

      {/* Información de seguridad */}
      <div className="text-center text-sm text-gray-500">
        <p className="flex justify-center items-center gap-1.5 font-medium text-slate-600">
          <Lock className="w-4 h-4 text-slate-500" /> Pago seguro procesado por Fiserv Connect
        </p>
        <p className="mt-1">
          Serás redirigido a una página segura para completar el pago
        </p>
      </div>
    </form>
  );
}
