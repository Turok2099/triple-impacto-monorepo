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
  const [todosLosCupones, setTodosLosCupones] = useState<PublicCouponDto[]>([]);
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

      cargarCupones(true).catch((err) => {
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
      cargarCupones(true);
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
        cargarCupones(true);
      }
    }, 500); // Esperar 500ms después de que el usuario deje de escribir

    return () => clearTimeout(timer);
  }, [busqueda]);

  const realizarBusqueda = async () => {
    setBusquedaActiva(true);
    await cargarCupones(true, busqueda);
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

  const cargarCupones = async (reset = true, terminoBusqueda?: string) => {
    if (reset) {
      setPaginaActual(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const data = await obtenerCuponesPublicos(
        categoriaSeleccionada === "Todo" ? undefined : categoriaSeleccionada,
        "relevant",
        terminoBusqueda
      );

      if (reset) {
        // Primera carga: guardar todos y mostrar primeros 8
        setTodosLosCupones(data);
        setCupones(data.slice(0, CUPONES_POR_PAGINA));
        setHayMasCupones(data.length > CUPONES_POR_PAGINA);
      } else {
        // Carrusel: reemplazar con los siguientes 8
        const inicio = paginaActual * CUPONES_POR_PAGINA;
        const fin = inicio + CUPONES_POR_PAGINA;
        const nuevosCupones = todosLosCupones.slice(inicio, fin);

        setCupones(nuevosCupones);
        setPaginaActual((prev) => prev + 1);
        setHayMasCupones(fin < todosLosCupones.length);
      }
    } catch (error) {
      console.error("Error al cargar cupones:", error);
      // No bloquear el dashboard por error en cupones
    } finally {
      setLoadingMore(false);
    }
  };

  const cargarMasCupones = () => {
    cargarCupones(false, busquedaActiva ? busqueda : undefined);
  };

  // Cupones a mostrar (ya vienen paginados del backend)
  const cuponesMostrados = cupones;
  const hayMasCuponesBusqueda = busquedaActiva && hayMasCupones;
  
  // Calcular total de páginas
  const totalPaginas = Math.ceil(todosLosCupones.length / CUPONES_POR_PAGINA);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center">
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
    <div className="bg-emerald-50 min-h-screen pb-20">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-emerald-100 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-emerald-600 flex items-center justify-center">
              <span className="text-white text-2xl">💚</span>
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">
                Impact Dashboard
              </h1>
              <p className="text-xs text-emerald-600 font-medium uppercase tracking-wider">
                Miembro Activo
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="size-10 flex items-center justify-center rounded-full bg-emerald-100/50 hover:bg-red-100 transition-colors"
            title="Cerrar sesión"
          >
            <span className="text-slate-900">🚪</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Top Section: Header & Summary */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-white rounded-xl p-5 shadow-sm border border-emerald-100 flex items-center gap-4">
            <div className="size-16 rounded-full bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center border-2 border-emerald-600">
              <span className="text-3xl">👤</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">
                ¡Hola, {dashboard.usuario.nombre.split(" ")[0]}!
              </h2>
              <p className="text-slate-500 text-sm">
                Generando impacto desde {new Date().getFullYear()}
              </p>
            </div>
          </div>

          <div className="flex-none bg-white rounded-xl p-5 shadow-sm border border-emerald-100 flex flex-col justify-center min-w-[200px]">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">
              Mi Impacto
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {cuponesRecibidos}
              </span>
              <span className="text-slate-500 font-medium">
                Cupones Recibidos
              </span>
            </div>
            <button
              onClick={() => router.push("/dashboard/historial")}
              className="mt-2 text-sm font-semibold text-emerald-600 flex items-center gap-1 hover:underline"
            >
              Ver reporte completo →
            </button>
          </div>
        </div>

        {/* Active Donations Section */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-lg font-bold">Donaciones Activas</h3>
            <a className="text-sm font-semibold text-emerald-600" href="/donar">
              Donar más
            </a>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
            {dashboard.fundaciones &&
            dashboard.fundaciones.filter((f) =>
              f.nombre.includes("Fundación Padres"),
            ).length > 0 ? (
              dashboard.fundaciones
                .filter((f) => f.nombre.includes("Fundación Padres"))
                .map((fundacion) => (
                  <div
                    key={fundacion.id}
                    className="flex-none w-44 bg-white rounded-xl p-4 shadow-sm border border-emerald-100"
                  >
                    <div className="size-12 rounded-lg bg-emerald-50 mb-3 flex items-center justify-center">
                      <span className="text-2xl">💝</span>
                    </div>
                    <p className="font-bold text-slate-900 truncate">
                      {fundacion.nombre}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Desde:{" "}
                      {new Date(fundacion.fechaAfiliacion).toLocaleDateString(
                        "es-AR",
                        {
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>
                ))
            ) : (
              <div className="flex-none w-full bg-white rounded-xl p-6 shadow-sm border border-emerald-100 text-center">
                <span className="text-4xl mb-2 block">💝</span>
                <p className="text-slate-600 text-sm">
                  Aún no has realizado donaciones. ¡Comienza hoy!
                </p>
                <a
                  href="/donar"
                  className="inline-block mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700"
                >
                  Donar Ahora
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Exclusive Benefits Section */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold">Beneficios Exclusivos</h3>

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
              <div className="flex gap-2 overflow-x-auto scrollbar-thin py-2 pb-4">
                {categorias.map((categoria) => (
                  <button
                    key={categoria.id}
                    onClick={() => setCategoriaSeleccionada(categoria.nombre)}
                    className={`shrink-0 whitespace-nowrap px-5 py-2 rounded-full font-bold text-sm transition-all ${
                      categoriaSeleccionada === categoria.nombre
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-emerald-100 hover:border-emerald-400"
                    }`}
                  >
                    {categoria.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Indicador de búsqueda activa */}
          {busquedaActiva && busqueda && (
            <div className="bg-emerald-100 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-emerald-700 font-bold">🔍 Buscando:</span>
                <span className="text-gray-700">"{busqueda}"</span>
                <span className="text-gray-500 text-sm">({todosLosCupones.length} resultados)</span>
              </div>
              <button
                onClick={() => setBusqueda('')}
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
                      src={cupon.imagen_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='190' viewBox='0 0 280 190'%3E%3Crect fill='%2310b981' width='280' height='190'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial,sans-serif' font-size='16' fill='%23fff' text-anchor='middle' dy='.3em'%3ECupón%3C/text%3E%3C/svg%3E"}
                      alt={cupon.titulo}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='190' viewBox='0 0 280 190'%3E%3Crect fill='%2310b981' width='280' height='190'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial,sans-serif' font-size='16' fill='%23fff' text-anchor='middle' dy='.3em'%3ECupón%3C/text%3E%3C/svg%3E";
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
                      src={cupon.logo_empresa || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90' viewBox='0 0 90 90'%3E%3Crect fill='%23f3f4f6' rx='12' width='90' height='90'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial,sans-serif' font-size='24' fill='%236b7280' text-anchor='middle' dy='.3em'%3E🎁%3C/text%3E%3C/svg%3E"}
                      alt={cupon.empresa || "Logo"}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90' viewBox='0 0 90 90'%3E%3Crect fill='%23f3f4f6' rx='12' width='90' height='90'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial,sans-serif' font-size='24' fill='%236b7280' text-anchor='middle' dy='.3em'%3E🎁%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>

                  {/* Contenido debajo de la imagen (padding para no quedar bajo el logo) */}
                  <div className="relative z-0 pt-24 sm:pt-28 pb-5 px-5 text-center">
                    {/* Descuento destacado */}
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                      {cupon.descuento || "Descuento especial"}
                    </p>
                    {/* Descripción en gris */}
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {cupon.descripcion || cupon.titulo}
                    </p>
                    {/* CTA */}
                    <button 
                      onClick={() => router.push("/dashboard/cupones-disponibles")}
                      className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors text-sm"
                    >
                      Ver detalles
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
                      if (busqueda) {
                        setPaginaActual((prev) => prev - 1);
                      } else {
                        // Para categorías, no tiene sentido ir atrás en carrusel
                        // pero lo dejamos por si acaso
                        setPaginaActual((prev) => {
                          const nuevaPagina = prev - 1;
                          const inicio = (nuevaPagina - 1) * CUPONES_POR_PAGINA;
                          const fin = inicio + CUPONES_POR_PAGINA;
                          setCupones(todosLosCupones.slice(inicio, fin));
                          setHayMasCupones(fin < todosLosCupones.length);
                          return nuevaPagina;
                        });
                      }
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
                {((hayMasCupones && !busqueda) ||
                  (busqueda && hayMasCuponesBusqueda)) && (
                  <button
                    onClick={() => {
                      if (busqueda) {
                        setPaginaActual((prev) => prev + 1);
                      } else {
                        cargarMasCupones();
                      }
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
