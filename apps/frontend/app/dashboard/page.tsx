"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { obtenerDashboard, DashboardUsuario } from "@/lib/dashboard";
import {
  obtenerCuponesPublicos,
  obtenerCategorias,
  obtenerCuponesRecibidos,
  PublicCouponDto,
  CategoriaDto,
} from "@/lib/bonda";
import { obtenerMisCupones, CuponSolicitado } from "@/lib/dashboard";
import { getOrganizationLogoUrl } from "@/lib/organization-logos";
import CuponDetalleModal from "@/components/dashboard/CuponDetalleModal";
import SeccionPerfil from "@/components/dashboard/SeccionPerfil";
import SeccionMisCupones from "@/components/dashboard/SeccionMisCupones";
import SeccionMisPagos from "@/components/dashboard/SeccionMisPagos";
import SeccionAdmin from "@/components/dashboard/SeccionAdmin";
import SeccionDonacion from "@/components/dashboard/SeccionDonacion";
import {
  Ticket,
  CheckCircle2,
  Heart,
  LayoutGrid,
  UserCircle,
  Gift,
  LogOut,
  Grid3x3,
  Shield,
  UtensilsCrossed,
  Sparkles,
  Laptop,
  Film,
  Dumbbell,
  Home,
  GraduationCap,
  ShoppingBag,
  Plane,
  Shirt,
  Car,
  Receipt,
} from "lucide-react";

type ActiveTab = "inicio" | "perfil" | "cupones" | "pagos" | "admin" | "donar";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout, handleSessionExpired } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("inicio");
  const [dashboard, setDashboard] = useState<DashboardUsuario | null>(null);
  const [cupones, setCupones] = useState<PublicCouponDto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDto[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState<string>("Todo");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [hayMasCupones, setHayMasCupones] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cuponesRecibidos, setCuponesRecibidos] = useState<number>(0);
  const [totalCuponesDisponibles, setTotalCuponesDisponibles] = useState<number>(0);
  const [dashboardCargado, setDashboardCargado] = useState(false);
  const [busquedaActiva, setBusquedaActiva] = useState(false);
  const [cuponSeleccionado, setCuponSeleccionado] = useState<PublicCouponDto | null>(null);
  const [misCupones, setMisCupones] = useState<CuponSolicitado[]>([]);
  const [fundacionLogoError, setFundacionLogoError] = useState<Record<string, boolean>>({});
  const CUPONES_POR_PAGINA = 10;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    // Cargar datos de forma secuencial: primero dashboard, luego el resto
    cargarTodoElDashboard();
  }, [user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const cargarTodoElDashboard = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Cargar dashboard principal (crítico) - debe completarse sin errores
      await cargarDashboard();
      setDashboardCargado(true);

      // 2. Cargar datos secundarios en paralelo (no bloquean, no causan error)
      cargarCategorias().catch((err) => {
        console.warn("Error al cargar categorías:", err);
      });

      cargarCupones(1).catch((err) => {
        console.warn("Error al cargar cupones:", err);
      });

      cargarCuponesRecibidos().catch((err) => {
        console.warn("Error al cargar cupones recibidos:", err);
      });

      cargarMisCupones().catch((err) => {
        console.warn("Error al cargar mis cupones:", err);
      });
    } catch (err: any) {
      console.error("Error crítico al cargar dashboard:", err);
      // Solo setear error si el dashboard principal falló
      if (err.message.includes("401") || err.message.includes("Unauthorized")) {
        handleSessionExpired();
      } else {
        setError(err.message || "Error al cargar el dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  const cargarCuponesRecibidos = async () => {
    try {
      const data = await obtenerCuponesRecibidos("beneficios-fundacion-padres");
      setCuponesRecibidos(data.count || 0);
    } catch (error: any) {
      // Es 100% normal que un usuario nuevo no tenga código de afiliado aún.
      // Así evitamos que Next.js levante una pantalla roja de error en desarrollo.
      if (error && error.message && error.message.includes('código de afiliado')) {
        setCuponesRecibidos(0);
        return;
      }
      console.warn("Aviso al cargar cupones recibidos:", error.message || error);
      setCuponesRecibidos(0);
    }
  };

  const cargarMisCupones = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    try {
      const data = await obtenerMisCupones(token);
      setMisCupones(data);
    } catch (error) {
      console.warn("Error al cargar mis cupones:", error);
    }
  };

  useEffect(() => {
    if (user && !busquedaActiva) {
      cargarCupones(1);
    }
  }, [categoriaSeleccionada]);

  // Búsqueda con debounce
  useEffect(() => {
    if (!user) return;

    const timer = setTimeout(() => {
      if (busqueda) {
        // Buscar en el backend
        realizarBusqueda();
      } else {
        // Volver a cargar cupones por categoría
        setBusquedaActiva(false);
        cargarCupones(1);
      }
    }, 500); // Esperar 500ms después de que el usuario deje de escribir

    return () => clearTimeout(timer);
  }, [busqueda]);

  const realizarBusqueda = async () => {
    setBusquedaActiva(true);
    await cargarCupones(1, busqueda);
  };

  const cargarDashboard = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      throw new Error("No se encontró token de autenticación");
    }

    try {
      const data = await obtenerDashboard(token);
      setDashboard(data);
    } catch (err: any) {
      // Si es error 401, redirigir a login
      if (err.message.includes("401") || err.message.includes("Unauthorized")) {
        handleSessionExpired();
        throw new Error("Sesión expirada");
      }
      throw err;
    }
  };

  const cargarCategorias = async () => {
    const cats = await obtenerCategorias();
    // No agregar "Todo" aquí porque ya viene del backend
    setCategorias(cats);
  };

  const cargarCupones = async (pagina: number = 1, terminoBusqueda?: string) => {
    if (pagina === 1) {
      setPaginaActual(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const offset = (pagina - 1) * CUPONES_POR_PAGINA;
      const { cupones: data, total } = await obtenerCuponesPublicos(
        categoriaSeleccionada === "Todo" ? undefined : categoriaSeleccionada,
        "relevant",
        terminoBusqueda,
        false, // NO deduplicar en dashboard - mostrar TODOS los cupones
        CUPONES_POR_PAGINA, // Límite: 10 cupones por página
        offset // Offset según la página actual
      );

      setCupones(data);
      setTotalCuponesDisponibles(total);
      setPaginaActual(pagina);
      setHayMasCupones((pagina * CUPONES_POR_PAGINA) < total);
    } catch (error) {
      console.error("Error al cargar cupones:", error);
      // No bloquear el dashboard por error en cupones
    } finally {
      setLoadingMore(false);
    }
  };

  // Cupones a mostrar (ya vienen paginados del backend)
  const cuponesMostrados = cupones;
  const hayMasCuponesBusqueda = busquedaActiva && hayMasCupones;

  // Calcular total de páginas usando el total real del backend
  const totalPaginas = Math.ceil(totalCuponesDisponibles / CUPONES_POR_PAGINA);

  // Función para obtener el icono según la categoría
  const getCategoryIcon = (categoryName: string) => {
    const iconMap: { [key: string]: any } = {
      Todo: Grid3x3,
      "Alimentos y Bebidas": UtensilsCrossed,
      "Belleza y Salud": Sparkles,
      Tecnología: Laptop,
      Entretenimiento: Film,
      Deportes: Dumbbell,
      Hogar: Home,
      Educación: GraduationCap,
      Moda: Shirt,
      Viajes: Plane,
      Compras: ShoppingBag,
      Automotriz: Car,
    };

    return iconMap[categoryName] || ShoppingBag;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error al cargar
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay dashboard aún, no renderizar nada (el spinner ya maneja el loading)
  if (!dashboard) {
    return null;
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-8">
      {/* Header */}
      <header className="bg-white px-6 py-6 border-b border-slate-100">
        <div className="max-w-7xl mx-auto">
          {/* Top row: Avatar + Nombre centrados */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <div
              className="size-16 rounded-full bg-cover bg-center ring-2 ring-slate-50 shadow-md"
              style={{
                backgroundImage: `url(https://ui-avatars.com/api/?name=${encodeURIComponent(dashboard.usuario.nombre)}&background=16a459&color=fff&size=192)`,
              }}
            ></div>
            <div className="flex flex-col md:flex-row items-center gap-3">
              <span className="font-bold text-xl text-[#1A202C] whitespace-nowrap">
                ¡Hola, {dashboard.usuario.nombre.split(" ")[0]}!
              </span>
              {user?.role === 'superadmin' ? (
                <span className="bg-purple-100 text-purple-700 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Administrador
                </span>
              ) : dashboard.fundaciones.some(f => f.isActive) ? (
                <span className="bg-emerald-100/60 text-emerald-700 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                  Colaborador
                </span>
              ) : (
                <span className="bg-slate-100 text-slate-500 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                  Inactivo
                </span>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={() => setActiveTab("inicio")}
              className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "inicio" ? "text-[#40a8ab]" : "text-slate-400 hover:text-[#40a8ab]"}`}
            >
              <LayoutGrid className="w-6 h-6" strokeWidth={2} />
              <span className={`text-xs ${activeTab === "inicio" ? "font-semibold" : "font-medium"}`}>Inicio</span>
            </button>
            <button
              onClick={() => setActiveTab("perfil")}
              className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "perfil" ? "text-[#40a8ab]" : "text-slate-400 hover:text-[#40a8ab]"}`}
            >
              <UserCircle className="w-6 h-6" strokeWidth={2} />
              <span className={`text-xs ${activeTab === "perfil" ? "font-semibold" : "font-medium"}`}>Perfil</span>
            </button>
            <button
              onClick={() => setActiveTab("cupones")}
              className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "cupones" ? "text-[#40a8ab]" : "text-slate-400 hover:text-[#40a8ab]"}`}
            >
              <Gift className="w-6 h-6" strokeWidth={2} />
              <span className={`text-xs ${activeTab === "cupones" ? "font-semibold" : "font-medium"}`}>Mis Cupones</span>
            </button>
            <button
              onClick={() => setActiveTab("pagos")}
              className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "pagos" ? "text-[#40a8ab]" : "text-slate-400 hover:text-[#40a8ab]"}`}
            >
              <Receipt className="w-6 h-6" strokeWidth={2} />
              <span className={`text-xs ${activeTab === "pagos" ? "font-semibold" : "font-medium"}`}>Mis pagos</span>
            </button>
            {user?.role === 'superadmin' && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "admin" ? "text-[#40a8ab]" : "text-slate-400 hover:text-[#40a8ab]"}`}
              >
                <Shield className="w-6 h-6" strokeWidth={2} />
                <span className={`text-xs ${activeTab === "admin" ? "font-semibold" : "font-medium"}`}>Admin</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab("donar")}
              className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "donar" ? "text-[#40a8ab]" : "text-slate-400 hover:text-[#40a8ab]"}`}
            >
              <Heart className="w-6 h-6" strokeWidth={2} />
              <span className={`text-xs ${activeTab === "donar" ? "font-semibold" : "font-medium"}`}>Donar +</span>
            </button>
            <button
              onClick={logout}
              className="flex flex-col items-center gap-1 text-slate-400 hover:text-red-500 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-6 h-6" strokeWidth={2} />
              <span className="text-xs font-medium">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Secciones Perfil, Mis Cupones y Mis pagos */}
      {activeTab === "perfil" && <SeccionPerfil />}
      {activeTab === "cupones" && <SeccionMisCupones />}
      {activeTab === "pagos" && <SeccionMisPagos />}
      {activeTab === "admin" && <SeccionAdmin />}
      {activeTab === "donar" && <SeccionDonacion />}

      <main className={`max-w-7xl mx-auto px-6 py-6 space-y-6 ${activeTab !== "inicio" ? "hidden" : ""}`}>
        {/* Impact Summary */}
        <section>
          <h2 className="text-[#1A202C] font-bold text-xl mb-4">
            Resumen de Impacto
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-slate-50 flex flex-col items-center gap-2">
              <Ticket className="w-8 h-8 text-[#40a8ab]" strokeWidth={1.5} />
              <p className="text-[10px] font-semibold text-[#718096] uppercase tracking-tight text-center">
                Cupones Activos
              </p>
              <p className="text-2xl font-bold text-[#40a8ab]">
                {dashboard.estadisticas?.cuponesActivos || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-slate-50 flex flex-col items-center gap-2">
              <CheckCircle2
                className="w-8 h-8 text-[#40a8ab]"
                strokeWidth={1.5}
              />
              <p className="text-[10px] font-semibold text-[#718096] uppercase tracking-tight text-center">
                Cupones Usados
              </p>
              <p className="text-2xl font-bold text-[#40a8ab]">
                {dashboard.estadisticas?.cuponesUsados || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-slate-50 flex flex-col items-center gap-2">
              <Heart className="w-8 h-8 text-[#40a8ab]" strokeWidth={1.5} />
              <p className="text-[10px] font-semibold text-[#718096] uppercase tracking-tight text-center">
                Total Donado
              </p>
              <p className="text-2xl font-bold text-[#40a8ab]">
                $
                {dashboard.estadisticas?.totalDonado?.toLocaleString("es-AR") ||
                  "0"}
              </p>
            </div>
          </div>
          <p className="mt-4 text-[12px] text-slate-400 font-medium">
            Último cupón solicitado:{" "}
            <span className="text-slate-600">
              {dashboard.estadisticas?.ultimoCuponSolicitado
                ? new Date(
                  dashboard.estadisticas.ultimoCuponSolicitado,
                ).toLocaleDateString("es-AR", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
                : "Nunca"}
            </span>
          </p>
        </section>

        {/* My Foundations */}
        <section className="py-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-[#1A202C]">
              Mis Fundaciones
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-4">
            {dashboard.fundaciones && dashboard.fundaciones.length > 0 ? (
              dashboard.fundaciones.map((fundacion) => {
                const logoUrl = getOrganizationLogoUrl(fundacion.nombre, fundacion.slug);
                const useLogo = !!logoUrl && !fundacionLogoError[fundacion.id];
                const initialsBg = `url(https://ui-avatars.com/api/?name=${encodeURIComponent(fundacion.nombre)}&background=16a459&color=fff&size=128)`;
                const totalDonado = fundacion.totalDonado ?? 0;
                const totalFormateado = totalDonado.toLocaleString("es-AR");
                const isInactive = fundacion.isActive === false;
                
                return (
                <div
                  key={fundacion.id}
                  className={`bg-white border rounded-3xl overflow-hidden shadow-[0_4px_20px_-2px_rgba(0,0,0,0.06)] transition-shadow flex flex-col h-full relative ${isInactive ? 'border-slate-200 opacity-60 grayscale' : 'border-slate-100 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)]'}`}
                >
                  {isInactive && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-20 shadow-sm flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Inactiva
                    </div>
                  )}
                  {/* Bloque logo centrado (sin caja: solo logo visible) */}
                  <div className="pt-6 pb-4 px-6 flex flex-col items-center flex-1">
                    <div className="size-20 shrink-0 flex items-center justify-center overflow-hidden">
                      {useLogo && logoUrl ? (
                        <img
                          src={logoUrl}
                          alt=""
                          className="size-20 object-contain object-center"
                          onError={() => setFundacionLogoError((prev) => ({ ...prev, [fundacion.id]: true }))}
                        />
                      ) : (
                        <div
                          className="size-20 rounded-full bg-cover bg-center shrink-0"
                          style={{ backgroundImage: initialsBg }}
                          aria-hidden
                        />
                      )}
                    </div>
                    <h4 className="font-bold text-[#1A202C] text-sm text-center mt-3 line-clamp-3 leading-tight">
                      {fundacion.nombre}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 mb-2">
                      Desde{" "}
                      {new Date(fundacion.fechaAfiliacion).toLocaleDateString("es-AR", {
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  {/* Bloque donado destacado */}
                  <div className="bg-[#40a8ab]/10 border-t border-[#40a8ab]/15 px-6 py-4 mt-auto">
                    <p className="text-[10px] text-[#40a8ab] uppercase font-bold tracking-wider mb-0.5">
                      Tu aporte
                    </p>
                    <p className="text-xl font-bold text-[#40a8ab]">
                      ${totalFormateado}
                    </p>
                  </div>
                </div>
              );
              })
            ) : (
              <div className="col-span-full bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] text-center">
                <span className="text-4xl mb-2 block">💝</span>
                <p className="text-slate-600 text-sm mb-4">
                  Aún no has realizado donaciones. ¡Comienza hoy!
                </p>
                <a
                  href="/donar"
                  className="inline-block px-6 py-3 bg-[#40a8ab] text-white rounded-full text-sm font-bold hover:bg-[#12854a] transition-colors"
                >
                  Donar Ahora
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Exclusive Benefits Section */}
        <section className="space-y-6">
          {(() => {
            const hasActiveOngs = dashboard.fundaciones?.some(f => f.isActive !== false) ?? false;
            
            if (!hasActiveOngs) {
              return (
                <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center shadow-sm relative overflow-hidden mt-8">
                  <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6">
                    <Shield className="w-16 h-16 text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Bloqueo de Beneficios</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                      Actualmente no cuentas con ninguna afiliación activa en nuestras ONGs. 
                      Para acceder a la red de descuentos exclusivos, debes estar acreditado 
                      en al menos una fundación activa.
                    </p>
                  </div>
                  {/* Fondo difuminado simulando cupones */}
                  <div className="opacity-10 blur-sm flex justify-center gap-4 pointer-events-none">
                    <div className="w-48 h-64 bg-slate-200 rounded-xl"></div>
                    <div className="w-48 h-64 bg-slate-200 rounded-xl"></div>
                    <div className="w-48 h-64 bg-slate-200 rounded-xl"></div>
                  </div>
                </div>
              );
            }

            return (
              <>
                <div className="flex items-center justify-center gap-3">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 tracking-tight">
              TUS DESCUENTOS EXCLUSIVOS
            </h2>
            <span className="inline-flex items-center justify-center px-4 py-2 bg-[#40a8ab] text-white text-lg font-bold rounded-full shadow-lg">
              {totalCuponesDisponibles}
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors">
              🔍
            </span>
            <input
              className="w-full bg-white border border-teal-100 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              placeholder="Buscar marcas y cupones..."
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {/* Filter Bar / Dropdown - Deshabilitado durante búsqueda */}
          {!busquedaActiva && (
            <div className="relative mb-4">
              {/* Mobile: Select Dropdown */}
              <div className="md:hidden">
                <div className="relative">
                  <select
                    value={categoriaSeleccionada}
                    onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                    className="w-full bg-white border border-teal-100 rounded-xl py-3 pl-4 pr-10 appearance-none focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none font-bold text-slate-700 shadow-sm transition-all"
                  >
                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.nombre}>
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              {/* Desktop: Horizontal Chip Filter Bar */}
              <div className="hidden md:flex flex-wrap gap-3 py-2 justify-center">
                {categorias.map((categoria) => {
                  const IconComponent = getCategoryIcon(categoria.nombre);
                  return (
                    <button
                      key={categoria.id}
                      onClick={() => setCategoriaSeleccionada(categoria.nombre)}
                      className={`flex items-center gap-2 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm transition-all hover:scale-110 ${categoriaSeleccionada === categoria.nombre
                        ? "bg-teal-600 text-white shadow-md"
                        : "bg-white text-slate-600 border border-teal-100 hover:border-teal-400 hover:shadow-md"
                        }`}
                    >
                      <IconComponent className="w-4 h-4" strokeWidth={2.5} />
                      {categoria.nombre}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Indicador de búsqueda activa */}
          {busquedaActiva && busqueda && (
            <div className="bg-teal-100 border border-teal-200 rounded-xl px-4 py-3 flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-teal-700 font-bold">🔍 Buscando:</span>
                <span className="text-gray-700">"{busqueda}"</span>
                <span className="text-gray-500 text-sm">
                  ({totalCuponesDisponibles} resultados)
                </span>
              </div>
              <button
                onClick={() => setBusqueda("")}
                className="text-teal-600 hover:text-teal-800 font-bold text-sm"
              >
                Limpiar ✕
              </button>
            </div>
          )}

          {/* Coupon Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-6">
            {cuponesMostrados.length > 0 ? (
              cuponesMostrados.map((cupon) => {
                const yaSolicitado = misCupones.find(
                  (mc) => mc.bondaCuponId === cupon.id && mc.estado === "activo"
                );
                const defaultLogo = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90' viewBox='0 0 90 90'%3E%3Crect fill='%23f3f4f6' rx='12' width='90' height='90'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial,sans-serif' font-size='24' fill='%236b7280' text-anchor='middle' dy='.3em'%3E🎁%3C/text%3E%3C/svg%3E";

                return (
                <div key={cupon.id} className="w-full h-full">
                  {/* Mobile: card horizontal compacta */}
                  <div className="md:hidden bg-white rounded-2xl p-4 flex items-center justify-between shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-50 w-full h-full">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="size-[4.5rem] shrink-0 overflow-hidden flex items-center justify-center">
                        <img
                          src={cupon.logo_empresa || defaultLogo}
                          alt=""
                          className="w-full h-full object-contain scale-125"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = defaultLogo;
                          }}
                        />
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="font-bold text-[#1A202C] text-sm leading-tight line-clamp-1">
                          {cupon.descuento || "Descuento especial"}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-1 flex-1">
                          {cupon.empresa || "Marca"}
                        </p>
                      </div>
                    </div>
                    {yaSolicitado ? (
                      <button
                        onClick={() => setCuponSeleccionado(cupon)}
                        className="bg-teal-100 text-teal-700 text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm active:scale-95 transition-transform shrink-0 whitespace-nowrap"
                      >
                        ✓ Activo
                      </button>
                    ) : (
                      <button
                        onClick={() => setCuponSeleccionado(cupon)}
                        className="bg-[#40a8ab] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-[#40a8ab]/20 active:scale-95 transition-transform shrink-0 whitespace-nowrap"
                      >
                        Obtener
                      </button>
                    )}
                  </div>

                  {/* Desktop: card vertical (oculta en móvil) */}
                  <div className="hidden md:flex bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 relative flex-col h-full">
                    <div className="relative h-44 overflow-hidden bg-gray-100 shrink-0">
                      <img
                        src={
                          cupon.imagen_url ||
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='190' viewBox='0 0 280 190'%3E%3Crect fill='%2310b981' width='280' height='190'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial,sans-serif' font-size='16' fill='%23fff' text-anchor='middle' dy='.3em'%3ECupón%3C/text%3E%3C/svg%3E"
                        }
                        alt={cupon.titulo}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='190' viewBox='0 0 280 190'%3E%3Crect fill='%2310b981' width='280' height='190'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial,sans-serif' font-size='16' fill='%23fff' text-anchor='middle' dy='.3em'%3ECupón%3C/text%3E%3C/svg%3E";
                        }}
                      />
                      <div className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-full bg-white text-black text-sm font-medium shadow-md">
                        {cupon.empresa || "Marca"}
                      </div>
                    </div>

                    <div className="absolute left-1/2 top-32 sm:top-28 -translate-x-1/2 z-10 w-36 h-36 sm:w-42 sm:h-42 rounded-xl bg-white shadow-lg flex items-center justify-center p-1 ring-2 ring-white overflow-hidden">
                      <img
                        src={cupon.logo_empresa || defaultLogo}
                        alt={cupon.empresa || "Logo"}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = defaultLogo;
                        }}
                      />
                    </div>

                    <div className="relative z-0 pt-24 sm:pt-28 pb-5 px-5 text-center flex-col flex flex-1 justify-between">
                      <div>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                          {cupon.descuento || "Descuento especial"}
                        </p>
                        <p className="text-sm text-gray-500 line-clamp-3 min-h-[3.6rem]">
                          {cupon.descripcion || cupon.titulo}
                        </p>
                      </div>
                      {yaSolicitado ? (
                        <button
                          onClick={() => setCuponSeleccionado(cupon)}
                          className="mt-4 w-full py-2.5 bg-teal-100 hover:bg-teal-200 text-teal-700 font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-1.5"
                        >
                          ✓ Ver mi código
                        </button>
                      ) : (
                        <button
                          onClick={() => setCuponSeleccionado(cupon)}
                          className="mt-4 w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors text-sm"
                        >
                          Obtener descuento
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                );
              })
            ) : (
              <div className="col-span-full bg-white rounded-xl p-8 text-center border border-teal-100">
                <span className="text-5xl mb-3 block">🔍</span>
                <p className="text-slate-600">No se encontraron cupones</p>
                <button
                  onClick={() => {
                    setBusqueda("");
                    setCategoriaSeleccionada("Todo");
                  }}
                  className="mt-3 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          {/* Navegación de Carrusel */}
          {((hayMasCupones && !busqueda) ||
            (busqueda && (hayMasCuponesBusqueda || paginaActual > 1))) &&
            cuponesMostrados.length > 0 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                {/* Botón Anterior */}
                {paginaActual > 1 && (
                  <button
                    onClick={() => {
                      cargarCupones(paginaActual - 1, busquedaActiva ? busqueda : undefined);
                    }}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-colors flex items-center gap-2"
                  >
                    <span>←</span>
                    Anterior
                  </button>
                )}

                {/* Indicador de página */}
                <span className="text-gray-600 font-medium">
                  Página {paginaActual} de {totalPaginas}
                </span>

                {/* Botón Siguiente */}
                {hayMasCupones && (
                  <button
                    onClick={() => {
                      cargarCupones(paginaActual + 1, busquedaActiva ? busqueda : undefined);
                    }}
                    disabled={loadingMore}
                    className="px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
                  >
                    {loadingMore ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Cargando...
                      </>
                    ) : (
                      <>
                        Siguiente
                        <span>→</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
              </>
            );
          })()}
        </section>
      </main>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Modal de detalle del cupón */}
      {cuponSeleccionado && (() => {
        const fundacionActiva = dashboard?.fundaciones?.find(
          (f) => f.codigoAfiliado && f.slug
        );
        if (!fundacionActiva) return null;
        return (
          <CuponDetalleModal
            cupon={cuponSeleccionado}
            codigoAfiliado={fundacionActiva.codigoAfiliado}
            micrositioSlug={fundacionActiva.slug}
            fundacionNombre={fundacionActiva.nombre}
            token={localStorage.getItem("auth_token") || ""}
            cuponYaSolicitado={
              misCupones.find(
                (mc) => mc.bondaCuponId === cuponSeleccionado.id && mc.estado === "activo"
              ) ?? null
            }
            onClose={() => setCuponSeleccionado(null)}
            onCuponSolicitado={(nuevoCupon) => {
              setMisCupones((prev) => [...prev, nuevoCupon]);
              if (dashboard) {
                setDashboard({
                  ...dashboard,
                  estadisticas: {
                    ...(dashboard.estadisticas || {}),
                    cuponesActivos: (dashboard.estadisticas?.cuponesActivos || 0) + 1,
                    ultimoCuponSolicitado: new Date().toISOString(),
                    cuponesUsados: dashboard.estadisticas?.cuponesUsados || 0,
                    totalDonado: dashboard.estadisticas?.totalDonado || 0,
                  }
                });
              }
            }}
          />
        );
      })()}
    </div>
  );
}
