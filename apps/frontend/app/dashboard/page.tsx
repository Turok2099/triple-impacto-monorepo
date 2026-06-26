"use client";

import { useEffect, useState, useRef } from "react";
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
  Search,
  X,
  History,
} from "lucide-react";

type ActiveTab = "inicio" | "perfil" | "admin" | "donar";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout, handleSessionExpired } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("inicio");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardUsuario | null>(null);
  const [cupones, setCupones] = useState<PublicCouponDto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDto[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState<string>("Todo");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [inputPagina, setInputPagina] = useState("1");
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

  const initEmpezado = useRef(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (initEmpezado.current) return;
    initEmpezado.current = true;

    // Cargar datos de forma secuencial: primero dashboard, luego el resto
    cargarTodoElDashboard();
  }, [user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const cargarTodoElDashboard = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Cargar dashboard principal (crítico) - debe completarse sin errores
      const initialSearch = await cargarDashboard();
      setDashboardCargado(true);

      // 2. Cargar datos secundarios en paralelo (no bloquean, no causan error)
      cargarCategorias().catch((err) => {
        console.warn("Error al cargar categorías:", err);
      });

      if (!initialSearch) {
        cargarCupones(1).catch((err) => {
          console.warn("Error al cargar cupones:", err);
        });
      }

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
    if (user && !busquedaActiva && dashboardCargado) {
      cargarCupones(1);
    }
  }, [categoriaSeleccionada]);

  // Búsqueda con debounce
  useEffect(() => {
    if (!user || !dashboardCargado) return;

    const timer = setTimeout(() => {
      if (busqueda) {
        // Buscar en el backend
        realizarBusqueda();
      } else if (busquedaActiva) {
        // Volver a cargar cupones por categoría
        setBusquedaActiva(false);
        cargarCupones(1);
      }
    }, 500); // Esperar 500ms después de que el usuario deje de escribir

    return () => clearTimeout(timer);
  }, [busqueda, dashboardCargado]);

  const realizarBusqueda = async () => {
    setBusquedaActiva(true);
    await cargarCupones(1, busqueda);
  };

  const cargarDashboard = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      throw new Error("No se encontró token de autenticación");
    }

    let initialSearch = null;

    try {
      const data = await obtenerDashboard(token);
      setDashboard(data);
      
      // Chequear si venimos desde la Home (con parámetro de búsqueda)
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const searchInput = params.get("busqueda");
        
        if (searchInput) {
          initialSearch = searchInput;
          const hasActiveSub = data.fundaciones?.some((f: any) => f.isActive);
          
          if (!hasActiveSub) {
             setActiveTab("donar");
             import("sweetalert2").then(Swal => {
               Swal.default.fire({
                 icon: "warning",
                 title: "Suscripción Inactiva",
                 text: "Para disfrutar de tus beneficios doná a alguna ONG",
                 confirmButtonColor: "#2c8184",
                 confirmButtonText: "Entendido"
               });
             });
          } else {
             // Tiene suscripción, abrir el buscador con la marca
             setBusqueda(searchInput);
             setBusquedaActiva(true);
          }
          
          // Limpiar la URL para evitar que se repita al recargar
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
      return initialSearch;
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
      setInputPagina(pagina.toString());
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2c8184] mx-auto mb-4"></div>
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
              className="px-4 py-2 bg-[#2c8184] text-white rounded-lg hover:bg-[#1e6063]"
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

  const hasActiveOngs = dashboard.fundaciones?.some(f => f.isActive !== false && f.codigoAfiliado) ?? false;

  return (
    <div className="bg-[#F8FAFC] min-h-screen flex flex-col md:flex-row">
      {/* Sidebar (Desktop) / Header (Mobile) */}
      <aside className="bg-white w-full md:w-64 lg:w-72 md:min-h-screen border-b md:border-b-0 md:border-r border-slate-200 flex flex-col md:sticky md:top-0 h-auto md:h-screen md:overflow-y-auto shrink-0 z-20">
        {/* Top row: Avatar + Nombre centrados */}
        <div className="p-6 md:p-8 flex flex-col items-center gap-4 border-b border-slate-100 shrink-0">
          <div
            className="size-16 md:size-24 rounded-full bg-cover bg-center ring-4 ring-slate-50 shadow-md"
            style={{
              backgroundImage: `url(${user?.avatar_url || dashboard.usuario.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(dashboard.usuario.nombre)}&background=16a459&color=fff&size=192`})`,
            }}
          ></div>
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="font-bold text-xl text-[#1A202C]">
              ¡Hola, {dashboard.usuario.nombre.split(" ")[0]}!
            </span>
            {user?.role === 'admin' ? (
              <span className="bg-purple-100 text-purple-700 text-[10px] md:text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                Administrador
              </span>
            ) : dashboard.fundaciones.some(f => f.isActive) ? (
              <span className="bg-emerald-100/60 text-emerald-700 text-[10px] md:text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                Colaborador
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-500 text-[10px] md:text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                Colaborador
              </span>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex md:flex-col items-center md:items-stretch overflow-x-auto md:overflow-visible gap-1 md:gap-2 p-2 md:p-4 hide-scrollbar">
          <button
            onClick={() => setActiveTab("inicio")}
            className={`flex flex-col md:flex-row items-center md:justify-start gap-1 md:gap-3 px-4 py-2 md:py-3.5 rounded-xl transition-all shrink-0 ${activeTab === "inicio" ? "bg-teal-50 text-[#2c8184]" : "text-slate-500 hover:bg-slate-50 hover:text-[#2c8184]"}`}
          >
            <LayoutGrid className="w-5 h-5 md:w-6 md:h-6" strokeWidth={activeTab === "inicio" ? 2.5 : 2} />
            <span className={`text-[11px] md:text-sm ${activeTab === "inicio" ? "font-bold" : "font-medium"}`}>Cuponera</span>
          </button>
          
          <button
            onClick={() => setActiveTab("perfil")}
            className={`flex flex-col md:flex-row items-center md:justify-start gap-1 md:gap-3 px-4 py-2 md:py-3.5 rounded-xl transition-all shrink-0 ${activeTab === "perfil" ? "bg-teal-50 text-[#2c8184]" : "text-slate-500 hover:bg-slate-50 hover:text-[#2c8184]"}`}
          >
            <UserCircle className="w-5 h-5 md:w-6 md:h-6" strokeWidth={activeTab === "perfil" ? 2.5 : 2} />
            <span className={`text-[11px] md:text-sm ${activeTab === "perfil" ? "font-bold" : "font-medium"}`}>Perfil</span>
          </button>


          {user?.role === 'admin' && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex flex-col md:flex-row items-center md:justify-start gap-1 md:gap-3 px-4 py-2 md:py-3.5 rounded-xl transition-all shrink-0 ${activeTab === "admin" ? "bg-teal-50 text-[#2c8184]" : "text-slate-500 hover:bg-slate-50 hover:text-[#2c8184]"}`}
            >
              <Shield className="w-5 h-5 md:w-6 md:h-6" strokeWidth={activeTab === "admin" ? 2.5 : 2} />
              <span className={`text-[11px] md:text-sm ${activeTab === "admin" ? "font-bold" : "font-medium"}`}>Admin</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("donar")}
            className={`flex flex-col md:flex-row items-center md:justify-start gap-1 md:gap-3 px-4 py-2 md:py-3.5 rounded-xl transition-all shrink-0 ${activeTab === "donar" ? "bg-teal-50 text-[#2c8184]" : "text-slate-500 hover:bg-slate-50 hover:text-[#2c8184]"}`}
          >
            <Heart className="w-5 h-5 md:w-6 md:h-6" strokeWidth={activeTab === "donar" ? 2.5 : 2} />
            <span className={`text-[11px] md:text-sm ${activeTab === "donar" ? "font-bold" : "font-medium"}`}>Donar +</span>
          </button>

          <div className="md:mt-auto hidden md:block border-t border-slate-100 pt-4 mt-4">
            <button
              onClick={logout}
              className="w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" strokeWidth={2} />
              <span className="text-sm font-medium">Salir</span>
            </button>
          </div>
          
          <button
            onClick={logout}
            className="md:hidden flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-slate-400 hover:text-red-500 transition-colors shrink-0"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" strokeWidth={2} />
            <span className="text-[11px] font-medium">Salir</span>
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 w-full min-w-0 flex flex-col">
      {/* Secciones Perfil, Mis Cupones y Mis pagos */}
      {activeTab === "perfil" && (
        <SeccionPerfil 
          isActive={dashboard.fundaciones?.some(f => f.isActive) || false} 
          role={user?.role || 'user'}
          dashboard={dashboard}
        />
      )}

      {activeTab === "admin" && <SeccionAdmin />}
      {activeTab === "donar" && <SeccionDonacion />}

      <main className={`max-w-7xl mx-auto px-6 py-6 space-y-6 ${activeTab !== "inicio" ? "hidden" : ""}`}>
        {/* Exclusive Benefits Section */}
        <section className="space-y-6">
          {(() => {
            if (!hasActiveOngs) {
              return (
                <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 text-center shadow-sm relative overflow-hidden mt-8 min-h-[320px] flex items-center justify-center">
                  {/* Fondo difuminado simulando cupones (detrás del contenido) */}
                  <div className="absolute inset-0 opacity-[0.03] sm:opacity-[0.07] blur-[2px] flex justify-center items-center gap-4 pointer-events-none z-0">
                    <div className="w-32 h-44 sm:w-48 sm:h-64 bg-slate-400 rounded-xl shrink-0"></div>
                    <div className="w-32 h-44 sm:w-48 sm:h-64 bg-slate-400 rounded-xl shrink-0"></div>
                    <div className="w-32 h-44 sm:w-48 sm:h-64 bg-slate-400 rounded-xl shrink-0"></div>
                  </div>
                  
                  {/* Contenido en flujo normal (se adapta automáticamente al alto de cualquier dispositivo) */}
                  <div className="relative z-10 flex flex-col items-center justify-center p-2 max-w-md mx-auto">
                    <div className="size-14 sm:size-16 rounded-2xl bg-slate-50 border border-slate-100 shadow-xs flex items-center justify-center text-slate-400 mb-4">
                      <Shield className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">Bloqueo de Beneficios</h3>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
                      Actualmente no cuentas con ninguna afiliación activa en nuestras ONGs. 
                      Para acceder a la red de descuentos exclusivos, debes estar acreditado 
                      en al menos una fundación activa.
                    </p>
                    <button
                      onClick={() => setActiveTab("donar")}
                      className="px-6 py-3 bg-[#2c8184] hover:bg-[#1e6063] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      Donar ahora para activar
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-slate-950 tracking-tight">
                      TUS DESCUENTOS EXCLUSIVOS
                    </h2>
                    <span className="inline-flex items-center justify-center px-3.5 py-1.5 bg-[#2c8184] text-white text-sm font-bold rounded-full shadow-md">
                      {totalCuponesDisponibles}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsHistoryOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:text-[#2c8184] hover:border-[#2c8184] hover:shadow-sm font-bold text-xs md:text-sm rounded-xl transition-all shadow-sm shrink-0"
                  >
                    <History className="w-4 h-4" />
                    Ver Cupones Usados
                  </button>
                </div>

          {/* Search Bar Redesign */}
          <div className="relative group max-w-2xl mx-auto w-full">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2c8184] transition-colors pointer-events-none">
              <Search className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <input
              className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-12 focus:ring-4 focus:ring-[#2c8184]/10 focus:border-[#2c8184] outline-none transition-all shadow-sm text-slate-700 font-medium placeholder:text-slate-400"
              placeholder="¿Qué marca o descuento buscás hoy?"
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                title="Limpiar búsqueda"
              >
                <X className="w-4 h-4" strokeWidth={3} />
              </button>
            )}
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
                    className="w-full bg-white border border-teal-100 rounded-xl py-3 pl-4 pr-10 appearance-none focus:ring-2 focus:ring-[#2c8184] focus:border-transparent outline-none font-bold text-slate-700 shadow-sm transition-all"
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
                        ? "bg-[#2c8184] text-white shadow-md"
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
                        className="bg-[#2c8184] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-[#2c8184]/20 active:scale-95 transition-transform shrink-0 whitespace-nowrap"
                      >
                        Obtener
                      </button>
                    )}
                  </div>

                  {/* Desktop: card vertical (oculta en móvil) */}
                  <div 
                    onClick={() => setCuponSeleccionado(cupon)}
                    className="hidden md:flex flex-col bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-slate-100/80 relative cursor-pointer h-full"
                  >
                    {yaSolicitado && (
                      <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-[11px] font-bold shadow-sm">
                        ✓ Activo
                      </div>
                    )}
                    <div className="relative h-32 overflow-hidden bg-slate-50 shrink-0">
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
                    </div>

                    {/* Floating Overlapping Logo Container */}
                    <div className="absolute left-1/2 top-32 -translate-x-1/2 -translate-y-1/2 z-10 w-24 h-24 rounded-2xl bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] flex items-center justify-center p-2 border border-slate-50 overflow-hidden">
                      <img
                        src={cupon.logo_empresa || defaultLogo}
                        alt={cupon.empresa || "Logo"}
                        className="w-full h-full object-contain p-1.5"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = defaultLogo;
                        }}
                      />
                    </div>

                    {/* Card Body */}
                    <div className="relative z-0 pt-16 pb-6 px-5 text-center flex flex-col items-center justify-between flex-1">
                      {/* Pill Badge with Company Name */}
                      <div className="px-4 py-1.5 border border-slate-200/60 rounded-full text-[11px] font-bold tracking-wider text-slate-700 bg-white mb-4 shadow-sm uppercase leading-none">
                        {cupon.empresa || "Marca"}
                      </div>

                      {/* Discount Headline */}
                      <p className="text-3xl font-black text-slate-900 mb-2 leading-none">
                        {cupon.descuento || "Descuento especial"}
                      </p>

                      {/* Benefit Detail */}
                      <p className="text-[13px] text-slate-500 font-medium leading-relaxed line-clamp-3 min-h-[3rem] px-2 mb-1">
                        {cupon.descripcion || cupon.titulo}
                      </p>
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
                  className="mt-3 px-4 py-2 bg-[#2c8184] text-white rounded-lg text-sm font-bold hover:bg-[#1e6063]"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          {/* Navegación de Paginación */}
          {(hayMasCupones || paginaActual > 1) && cuponesMostrados.length > 0 && (
            <div className="flex justify-center items-center gap-3 mt-10">
              {/* Botón Anterior */}
              <button
                onClick={() => {
                  cargarCupones(paginaActual - 1, busquedaActiva ? busqueda : undefined);
                }}
                disabled={paginaActual <= 1 || loadingMore}
                className={`px-5 py-2.5 font-bold rounded-xl transition-all flex items-center gap-2 ${
                  paginaActual <= 1 || loadingMore
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-white border border-teal-100 text-teal-700 hover:bg-teal-50 hover:border-teal-300 shadow-sm"
                }`}
              >
                <span>←</span>
                Anterior
              </button>

              {/* Indicadores de página */}
              <div className="hidden sm:flex items-center gap-2 mx-2">
                <span className="text-sm font-semibold text-slate-500 flex items-center justify-center gap-2">
                  Página 
                  <input 
                    type="number" 
                    min={1} 
                    max={totalPaginas} 
                    value={inputPagina} 
                    onChange={(e) => setInputPagina(e.target.value)}
                    onBlur={() => {
                      const val = parseInt(inputPagina);
                      if (!isNaN(val) && val >= 1 && val <= totalPaginas && val !== paginaActual) {
                         cargarCupones(val, busquedaActiva ? busqueda : undefined);
                      } else {
                         setInputPagina(paginaActual.toString());
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = parseInt(inputPagina);
                        if (!isNaN(val) && val >= 1 && val <= totalPaginas && val !== paginaActual) {
                           cargarCupones(val, busquedaActiva ? busqueda : undefined);
                        } else {
                           setInputPagina(paginaActual.toString());
                        }
                      }
                    }}
                    className="w-16 text-center text-teal-700 bg-teal-50 border border-teal-200 outline-none focus:ring-2 focus:ring-[#2c8184] px-2 py-1 rounded-lg appearance-none font-bold transition-all"
                  /> 
                  de {totalPaginas}
                </span>
              </div>
              <div className="flex sm:hidden items-center gap-2">
                <input 
                    type="number" 
                    min={1} 
                    max={totalPaginas} 
                    value={inputPagina} 
                    onChange={(e) => setInputPagina(e.target.value)}
                    onBlur={() => {
                      const val = parseInt(inputPagina);
                      if (!isNaN(val) && val >= 1 && val <= totalPaginas && val !== paginaActual) {
                         cargarCupones(val, busquedaActiva ? busqueda : undefined);
                      } else {
                         setInputPagina(paginaActual.toString());
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = parseInt(inputPagina);
                        if (!isNaN(val) && val >= 1 && val <= totalPaginas && val !== paginaActual) {
                           cargarCupones(val, busquedaActiva ? busqueda : undefined);
                        } else {
                           setInputPagina(paginaActual.toString());
                        }
                      }
                    }}
                    className="w-12 text-center text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 outline-none focus:ring-2 focus:ring-slate-400 px-1 py-1 rounded-lg appearance-none transition-all"
                  />
                  <span className="text-xs font-bold text-slate-500">/ {totalPaginas}</span>
              </div>

              {/* Botón Siguiente */}
              <button
                onClick={() => {
                  cargarCupones(paginaActual + 1, busquedaActiva ? busqueda : undefined);
                }}
                disabled={!hayMasCupones || loadingMore}
                className={`px-5 py-2.5 font-bold rounded-xl transition-all flex items-center gap-2 ${
                  !hayMasCupones
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-[#2c8184] text-white hover:bg-[#2c8184] shadow-lg shadow-teal-500/20"
                }`}
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="hidden sm:inline">Cargando...</span>
                  </>
                ) : (
                  <>
                    Siguiente
                    <span>→</span>
                  </>
                )}
              </button>
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

      {/* Drawer de historial de cupones usados */}
      <SeccionMisCupones isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} isBlocked={!hasActiveOngs} />
    </div>
  );
}
