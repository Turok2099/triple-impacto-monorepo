"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { User, Phone, MapPin, AlertCircle, Gift } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

const PROVINCIAS = [
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

export default function CompletarPerfilPage() {
  const router = useRouter();
  const { login: loginContext } = useAuth();
  
  const [token, setToken] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  
  const [dni, setDni] = useState("");
  const [telefonoCodigo, setTelefonoCodigo] = useState("+54");
  const [telefonoNumero, setTelefonoNumero] = useState("");
  const [provincia, setProvincia] = useState("");
  const [localidad, setLocalidad] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Localidad Autocomplete States
  const [sugerencias, setSugerencias] = useState<{ nombre: string; provincia: string }[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [buscandoLocalidad, setBuscandoLocalidad] = useState(false);

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = () => {
      setMostrarSugerencias(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Fetch localidades con debouncing
  useEffect(() => {
    if (localidad.trim().length < 3) {
      setSugerencias([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setBuscandoLocalidad(true);
      try {
        let url = `https://apis.datos.gob.ar/georef/api/localidades?nombre=${encodeURIComponent(localidad)}&max=10`;
        if (provincia) {
          url += `&provincia=${encodeURIComponent(provincia)}`;
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        
        if (data.localidades) {
          const items = data.localidades.map((loc: any) => ({
            nombre: loc.nombre,
            provincia: loc.provincia.nombre,
          }));
          setSugerencias(items);
        }
      } catch (err) {
        console.error("Error al buscar localidades:", err);
      } finally {
        setBuscandoLocalidad(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [localidad, provincia]);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          router.push("/login");
          return;
        }
        setToken(session.access_token);
      } catch (err) {
        console.error("Error al obtener sesión de Supabase:", err);
        router.push("/login");
      } finally {
        setLoadingSession(false);
      }
    };
    fetchSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    // Validar DNI
    if (!dni.trim() || dni.trim().length < 6) {
      setError("Por favor ingresa un DNI válido.");
      return;
    }
    
    setError(null);
    setLoading(true);

    try {
      const payload = {
        dni: dni.trim(),
        telefono: telefonoNumero ? `${telefonoCodigo} ${telefonoNumero.trim()}` : undefined,
        provincia: provincia.trim() || undefined,
        localidad: localidad.trim() || undefined,
      };

      const response = await fetch(`${API_URL}/auth/sso-sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al guardar los datos.");
      }

      // Iniciar sesión en el contexto usando el token y los datos devueltos
      loginContext(token, data.user);
      
      const localRedirect = localStorage.getItem("redirectAfterLogin");
      if (localRedirect) {
        localStorage.removeItem("redirectAfterLogin");
        window.location.href = localRedirect;
      } else {
        window.location.href = "/dashboard";
      }
      
    } catch (err: any) {
      setError(err.message || "Ocurrió un problema al guardar tus datos.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loadingSession) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f4fafb] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
        
        <div className="bg-[#2c8184] p-8 text-center flex flex-col items-center">
          <img
            src="https://res.cloudinary.com/dxbtafe9u/image/upload/q_auto,f_auto,w_200,c_limit/v1775685229/ISOLOGOTIPO_AYNI_FONDO_TRANSPARENTE_iwyuaw.png"
            alt="AYNI"
            className="h-12 w-auto object-contain mb-3"
          />
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Completar perfil</h2>
          <p className="text-teal-50 text-sm md:text-base">Necesitamos algunos datos para finalizar tu registro</p>
        </div>

        <div className="p-8">
          
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <Gift className="w-6 h-6 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-900 leading-relaxed font-medium">
              Para el uso de los beneficios de AYNI es <strong>indispensable contar con tu DNI</strong>. ¡Esto te dará acceso a más de 1.700 cupones de descuento!
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50/80 border border-red-200/60 shadow-sm rounded-xl p-4 transition-all">
              <div className="flex items-start gap-4">
                <div className="bg-red-100/80 p-2 rounded-full shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="pt-0.5 w-full">
                  <p className="text-sm md:text-base font-bold text-red-900 mb-1 tracking-tight">
                    Error
                  </p>
                  <p className="text-sm md:text-base text-red-800 leading-relaxed font-medium">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* DNI */}
            <div>
              <label htmlFor="dni" className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                DNI <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="dni"
                  name="dni"
                  type="text"
                  required
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                  className="block w-full pl-10 pr-3 py-3 text-sm md:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Tu DNI sin puntos"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="telefono" className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                Teléfono (Opcional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={telefonoCodigo}
                  onChange={(e) => setTelefonoCodigo(e.target.value)}
                  className="w-20 px-3 py-3 text-sm md:text-base border border-gray-300 rounded-xl text-center"
                  placeholder="+54"
                  disabled={loading}
                />
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    value={telefonoNumero}
                    onChange={(e) => setTelefonoNumero(e.target.value.replace(/\D/g, ''))}
                    className="block w-full pl-10 pr-3 py-3 text-sm md:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="11 1234 5678"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Provincia y Localidad */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                  Provincia (Opcional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={provincia}
                    onChange={(e) => {
                      setProvincia(e.target.value);
                      setLocalidad(""); // Reset localidad al cambiar de provincia
                    }}
                    className="block w-full pl-10 pr-3 py-3 text-sm md:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    disabled={loading}
                  >
                    <option value="">Selecciona provincia</option>
                    {PROVINCIAS.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                  Localidad (Opcional)
                </label>
                <input
                  type="text"
                  value={localidad}
                  onChange={(e) => {
                    setLocalidad(e.target.value);
                    setMostrarSugerencias(true);
                  }}
                  onFocus={() => setMostrarSugerencias(true)}
                  className="block w-full px-4 py-3 text-sm md:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Tu ciudad"
                  disabled={loading}
                  autoComplete="off"
                />
                
                {/* Dropdown de Sugerencias */}
                {mostrarSugerencias && (localidad.trim().length >= 3 || buscandoLocalidad) && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {buscandoLocalidad && (
                      <div className="p-3 text-sm text-gray-500 text-center">Buscando...</div>
                    )}
                    {!buscandoLocalidad && sugerencias.length === 0 && (
                      <div className="p-3 text-sm text-gray-500 text-center">No se encontraron localidades</div>
                    )}
                    {!buscandoLocalidad && sugerencias.map((sug, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setLocalidad(sug.nombre);
                          // Mapeo inteligente: si la provincia devuelta por el API está en nuestra lista, la seleccionamos
                          const matchingProv = PROVINCIAS.find(
                            (p) => p.toLowerCase() === sug.provincia.toLowerCase()
                          );
                          if (matchingProv) {
                            setProvincia(matchingProv);
                          }
                          setMostrarSugerencias(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-teal-50 transition-colors border-b border-gray-50 last:border-0 block"
                      >
                        <div className="font-medium text-gray-800">{sug.nombre}</div>
                        <div className="text-xs text-gray-400">{sug.provincia}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm md:text-base font-bold text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Guardando..." : "Completar Registro"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
