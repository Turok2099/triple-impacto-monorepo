"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Gift, Lock, CreditCard } from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "@/contexts/AuthContext";
import {
  obtenerOrganizaciones,
  formatearMonto,
  validarMonto,
  type Organizacion,
} from "@/lib/payments";

interface FormularioDonacionProps {
  onSubmit: (monto: number, organizacionId?: string) => void;
  loading?: boolean;
}

// Montos sugeridos predefinidos
const MONTOS_SUGERIDOS = [5000, 10000, 20000];
const MONTO_MINIMO = 5000;
const MONTO_MAXIMO = 500000;

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

  const montoMinimoActual = organizacionSeleccionada?.monto_minimo && organizacionSeleccionada.monto_minimo > 0 
    ? organizacionSeleccionada.monto_minimo 
    : MONTO_MINIMO;

  const montosSugeridosActuales = [
    montoMinimoActual,
    MONTOS_SUGERIDOS[1],
    MONTOS_SUGERIDOS[2],
  ];

  // Actualizar monto seleccionado si cambia la organización y el monto actual queda por debajo del mínimo
  useEffect(() => {
    if (montoSeleccionado !== null && !usarMontoCustom) {
      if (montoSeleccionado < montoMinimoActual) {
        setMontoSeleccionado(montoMinimoActual);
      }
    }
  }, [organizacionId, montoMinimoActual, montoSeleccionado, usarMontoCustom]);

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
    if (monto < montoMinimoActual) {
      setError(`El monto mínimo para donar es ${formatearMonto(montoMinimoActual)}`);
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

    // Validar monto en tiempo real
    const monto = parseFloat(value);
    if (!isNaN(monto) && monto > 0) {
      if (monto < montoMinimoActual) {
        setError(`El monto mínimo para donar es ${formatearMonto(montoMinimoActual)}`);
      } else if (monto > MONTO_MAXIMO) {
        setError(`El monto máximo permitido es ${formatearMonto(MONTO_MAXIMO)}`);
      } else {
        setError(null);
      }
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

    // Validar límites globales de monto
    if (montoFinal < montoMinimoActual) {
      setError(`El monto mínimo para donar es ${formatearMonto(montoMinimoActual)}`);
      return;
    }
    
    if (montoFinal > MONTO_MAXIMO) {
      setError(`El monto máximo permitido por transacción es ${formatearMonto(MONTO_MAXIMO)}`);
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

    // Validar configuración Fiserv
    if (organizacionSeleccionada && organizacionSeleccionada.has_fiserv_config === false) {
      Swal.fire({
        icon: 'warning',
        title: 'Aún no disponible para donación',
        text: 'Esta organización está completando su configuración de pagos.',
        confirmButtonColor: '#40a8ab',
      });
      return;
    }

    // Enviar al componente padre
    onSubmit(montoFinal, organizacionId || undefined);
  };

  // Mostrar loading mientras verifica autenticación
  if (authLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#40a8ab] mx-auto mb-4"></div>
        <p className="text-gray-600">Verificando sesión...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
        <p className="text-amber-800 mb-4">
          Tenés que iniciar sesión para realizar una donación
        </p>
        <a
          href="/login"
          className="inline-block px-6 py-2 bg-[#40a8ab] text-white rounded-lg hover:bg-[#40a8ab]"
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#40a8ab] mx-auto"></div>
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
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40a8ab] focus:border-[#40a8ab] text-gray-900 bg-white"
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
              const logoUrl = organizacionSeleccionada.logo_url;
              return (
                <div className="mt-4 p-5 bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col md:flex-row items-center gap-5 text-center md:text-left transition-all">
                  <div className="relative w-36 h-36 overflow-hidden shrink-0 flex items-center justify-center">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={organizacionSeleccionada.nombre}
                        className="w-full h-full object-contain object-center"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-[#40a8ab] text-4xl font-bold"
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
          {montosSugeridosActuales.map((monto) => (
            <button
              key={monto}
              type="button"
              onClick={() => handleMontoSugeridoClick(monto)}
              className={`py-3 px-4 rounded-lg font-medium text-center transition-all ${montoSeleccionado === monto && !usarMontoCustom
                ? "bg-[#40a8ab] text-white"
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
              ? "bg-[#40a8ab] text-white"
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
                min={montoMinimoActual}
                max={MONTO_MAXIMO}
                step="1"
                value={montoCustom}
                onChange={(e) => handleMontoCustomChange(e.target.value)}
                placeholder={montoMinimoActual.toString()}
                autoFocus
                className="w-full pl-8 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 border-[#40a8ab] focus:ring-[#40a8ab]"
              />
            </div>
          </div>
        )}

        {/* Mostrar monto mínimo de organización si es mayor (ya está manejado dinámicamente) */}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Resumen */}
      <div className="bg-gradient-to-r from-teal-50 to-slate-50 rounded-lg p-6">
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

        <div className="mt-4 pt-4 border-t border-teal-200">
          <div className="flex items-start gap-3 text-sm text-teal-800">
            <Gift className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#40a8ab]" />
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
        className="w-full py-4 px-6 bg-gradient-to-r from-[#40a8ab] to-teal-600 text-white font-bold rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
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
