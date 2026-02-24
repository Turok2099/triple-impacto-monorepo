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
import {
  Ticket,
  CheckCircle2,
  Heart,
  Wallet,
  LayoutGrid,
  UserCircle,
  Gift,
  LogOut,
  Grid3x3,
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
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();
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
  const CUPONES_POR_PAGINA = 10;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    // Cargar datos de forma secuencial: primero dashboard, luego el resto
    cargarTodoElDashboard();
  }, [user, authLoading, router]);

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
    } catch (err: any) {
      console.error("Error crítico al cargar dashboard:", err);
      // Solo setear error si el dashboard principal falló
      if (err.message.includes("401") || err.message.includes("Unauthorized")) {
        setError("Tu sesión ha expirado. Redirigiendo a login...");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
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
    } catch (error) {
      console.error("Error al cargar cupones recibidos:", error);
      // No mostrar error, solo dejar en 0
      setCuponesRecibidos(0);
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
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        router.push("/login");
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
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
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
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
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl text-[#1A202C]">
                ¡Hola, {dashboard.usuario.nombre.split(" ")[0]}!
              </span>
              <span className="bg-[#16a459]/10 text-[#16a459] text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Miembro Activo
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center justify-center gap-8">
            <a
              className="flex flex-col items-center gap-1 text-[#16a459] transition-colors"
              href="/dashboard"
            >
              <LayoutGrid className="w-6 h-6" strokeWidth={2} />
              <span className="text-xs font-semibold">Inicio</span>
            </a>
            <a
              className="flex flex-col items-center gap-1 text-slate-400 hover:text-[#16a459] transition-colors"
              href="/dashboard/perfil"
            >
              <UserCircle className="w-6 h-6" strokeWidth={2} />
              <span className="text-xs font-medium">Perfil</span>
            </a>
            <a
              className="flex flex-col items-center gap-1 text-slate-400 hover:text-[#16a459] transition-colors"
              href="/dashboard/mis-cupones"
            >
              <Gift className="w-6 h-6" strokeWidth={2} />
              <span className="text-xs font-medium">Mis Cupones</span>
            </a>
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

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Impact Summary */}
        <section>
          <h2 className="text-[#1A202C] font-bold text-xl mb-4">
            Resumen de Impacto
          </h2>
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-slate-50 flex flex-col items-center gap-2">
              <Ticket className="w-8 h-8 text-[#16a459]" strokeWidth={1.5} />
              <p className="text-[10px] font-semibold text-[#718096] uppercase tracking-tight text-center">
                Cupones Activos
              </p>
              <p className="text-2xl font-bold text-[#16a459]">
                {dashboard.estadisticas?.cuponesActivos || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-slate-50 flex flex-col items-center gap-2">
              <CheckCircle2
                className="w-8 h-8 text-[#16a459]"
                strokeWidth={1.5}
              />
              <p className="text-[10px] font-semibold text-[#718096] uppercase tracking-tight text-center">
                Cupones Usados
              </p>
              <p className="text-2xl font-bold text-[#16a459]">
                {dashboard.estadisticas?.cuponesUsados || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-slate-50 flex flex-col items-center gap-2">
              <Heart className="w-8 h-8 text-[#16a459]" strokeWidth={1.5} />
              <p className="text-[10px] font-semibold text-[#718096] uppercase tracking-tight text-center">
                Total Donado
              </p>
              <p className="text-2xl font-bold text-[#16a459]">
                $
                {dashboard.estadisticas?.totalDonado?.toLocaleString("es-AR") ||
                  "0"}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-slate-50 flex flex-col items-center gap-2">
              <Wallet className="w-8 h-8 text-[#16a459]" strokeWidth={1.5} />
              <p className="text-[10px] font-semibold text-[#718096] uppercase tracking-tight text-center">
                Total Ahorrado
              </p>
              <p className="text-2xl font-bold text-[#16a459]">
                ${(dashboard.estadisticas?.cuponesUsados || 0) * 50}
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
            <a
              href="/donar"
              className="bg-[#16a459] text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#16a459]/20 active:scale-95 transition-transform"
            >
              <span className="text-sm">+</span>
              Donar Más
            </a>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
            {dashboard.fundaciones && dashboard.fundaciones.length > 0 ? (
              dashboard.fundaciones.map((fundacion) => (
                <div
                  key={fundacion.id}
                  className="min-w-[280px] bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-center gap-4 mb-5">
                    <div
                      className="size-14 rounded-2xl bg-cover bg-center shrink-0 shadow-sm"
                      style={{
                        backgroundImage: `url(https://ui-avatars.com/api/?name=${encodeURIComponent(fundacion.nombre)}&background=16a459&color=fff&size=128)`,
                      }}
                    ></div>
                    <div>
                      <h4 className="font-bold text-[#1A202C] text-base">
                        {fundacion.nombre}
                      </h4>
                      <p className="text-[11px] text-[#718096]">
                        Desde{" "}
                        {new Date(fundacion.fechaAfiliacion).toLocaleDateString(
                          "es-AR",
                          {
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-end border-t border-slate-50 pt-4">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                        Impacto
                      </p>
                      <p className="text-lg font-bold text-[#16a459]">
                        $0.00{" "}
                        <span className="text-[10px] text-slate-400 font-normal">
                          donado
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-1 bg-slate-50 rounded text-[10px] font-bold text-slate-500 uppercase">
                        Único
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="min-w-full bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] text-center">
                <span className="text-4xl mb-2 block">💝</span>
                <p className="text-slate-600 text-sm mb-4">
                  Aún no has realizado donaciones. ¡Comienza hoy!
                </p>
                <a
                  href="/donar"
                  className="inline-block px-6 py-3 bg-[#16a459] text-white rounded-full text-sm font-bold hover:bg-[#12854a] transition-colors"
                >
                  Donar Ahora
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Exclusive Benefits Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-center gap-3">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 tracking-tight">
              TUS DESCUENTOS EXCLUSIVOS
            </h2>
            <span className="inline-flex items-center justify-center px-4 py-2 bg-[#16a459] text-white text-lg font-bold rounded-full shadow-lg">
              {totalCuponesDisponibles}
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
              🔍
            </span>
            <input
              className="w-full bg-white border border-emerald-100 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              placeholder="Buscar marcas y cupones..."
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {/* Horizontal Chip Filter Bar - Deshabilitado durante búsqueda */}
          {!busquedaActiva && (
            <div className="relative mb-4">
              <div className="flex flex-wrap gap-3 py-2 justify-center">
                {categorias.map((categoria) => {
                  const IconComponent = getCategoryIcon(categoria.nombre);
                  return (
                    <button
                      key={categoria.id}
                      onClick={() => setCategoriaSeleccionada(categoria.nombre)}
                      className={`flex items-center gap-2 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm transition-all hover:scale-110 ${
                        categoriaSeleccionada === categoria.nombre
                          ? "bg-emerald-600 text-white shadow-md"
                          : "bg-white text-slate-600 border border-emerald-100 hover:border-emerald-400 hover:shadow-md"
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
            <div className="bg-emerald-100 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-emerald-700 font-bold">🔍 Buscando:</span>
                <span className="text-gray-700">"{busqueda}"</span>
                <span className="text-gray-500 text-sm">
                  ({totalCuponesDisponibles} resultados)
                </span>
              </div>
              <button
                onClick={() => setBusqueda("")}
                className="text-emerald-600 hover:text-emerald-800 font-bold text-sm"
              >
                Limpiar ✕
              </button>
            </div>
          )}

          {/* Coupon Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {cuponesMostrados.length > 0 ? (
              cuponesMostrados.map((cupon) => (
                <div
                  key={cupon.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 relative"
                >
                  {/* Bloque superior: imagen de fondo */}
                  <div className="relative h-44 overflow-hidden bg-gray-100">
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
                    {/* Nombre de la marca: esquina superior derecha, blanco con texto negro */}
                    <div className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-full bg-white text-black text-sm font-medium shadow-md">
                      {cupon.empresa || "Marca"}
                    </div>
                  </div>

                  {/* Logo: bloque cuadrado (alto = ancho), imagen ajustada solo al ancho del bloque */}
                  <div className="absolute left-1/2 top-32 sm:top-28 -translate-x-1/2 z-10 w-36 h-36 sm:w-42 sm:h-42 rounded-xl bg-white shadow-lg flex items-center justify-center p-1 ring-2 ring-white overflow-hidden">
                    <img
                      src={
                        cupon.logo_empresa ||
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90' viewBox='0 0 90 90'%3E%3Crect fill='%23f3f4f6' rx='12' width='90' height='90'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial,sans-serif' font-size='24' fill='%236b7280' text-anchor='middle' dy='.3em'%3E🎁%3C/text%3E%3C/svg%3E"
                      }
                      alt={cupon.empresa || "Logo"}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90' viewBox='0 0 90 90'%3E%3Crect fill='%23f3f4f6' rx='12' width='90' height='90'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial,sans-serif' font-size='24' fill='%236b7280' text-anchor='middle' dy='.3em'%3E🎁%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>

                  {/* Contenido debajo de la imagen (padding para no quedar bajo el logo) */}
                  <div className="relative z-0 pt-24 sm:pt-28 pb-5 px-5 text-center">
                    {/* Descuento destacado */}
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                      {cupon.descuento || "Descuento especial"}
                    </p>
                    {/* Descripción en gris - Siempre 3 líneas */}
                    <p className="text-sm text-gray-500 line-clamp-3 min-h-[3.6rem]">
                      {cupon.descripcion || cupon.titulo}
                    </p>
                    {/* CTA */}
                    <button
                      onClick={() => {
                        // TODO: Abrir modal de solicitud de cupón o implementar lógica de solicitud
                        alert(`Solicitar cupón: ${cupon.titulo}`);
                      }}
                      className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors text-sm"
                    >
                      Obtener descuento
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white rounded-xl p-8 text-center border border-emerald-100">
                <span className="text-5xl mb-3 block">🔍</span>
                <p className="text-slate-600">No se encontraron cupones</p>
                <button
                  onClick={() => {
                    setBusqueda("");
                    setCategoriaSeleccionada("Todo");
                  }}
                  className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700"
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
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
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
    </div>
  );
}
