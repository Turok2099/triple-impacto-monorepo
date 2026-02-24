"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CuponDto, PublicCouponDto } from "@/lib/types/cupon";
import { obtenerCuponesPublicos } from "@/lib/bonda";
import CuponCard from "./CuponCard";

/** Convierte cupón público al formato que usa CuponCard (sin códigos). */
function publicToCuponDto(p: PublicCouponDto): CuponDto {
  return {
    id: p.id,
    nombre: p.titulo,
    descuento: p.descuento ?? "",
    descripcion: p.descripcion ?? undefined,
    codigoAfiliado: "",
    micrositioId: "",
    incluirCodigo: "0",
    empresa: {
      id: "",
      nombre: p.empresa ?? p.titulo,
      logoThumbnail: p.logo_empresa ? { "90x90": p.logo_empresa } : undefined,
    },
    imagenes: {
      principal: p.imagen_url ? { "280x190": p.imagen_url } : undefined,
      thumbnail: p.imagen_url ? { "90x90": p.imagen_url } : undefined,
    },
    envio: undefined,
  };
}

interface CuponesShowcaseProps {
  /** Slug del micrositio Bonda para cupones (ej. club-impacto-proyectar). */
  microsite?: string;
}

export default function CuponesShowcase({ microsite }: CuponesShowcaseProps) {
  const router = useRouter();
  const [cupones, setCupones] = useState<CuponDto[]>([]);
  const [todosLosCupones, setTodosLosCupones] = useState<CuponDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clicsRestantes, setClicsRestantes] = useState(3);

  useEffect(() => {
    cargarCupones();
  }, []);

  async function cargarCupones() {
    try {
      setLoading(true);
      setError(null);

      // Llamar al backend con orderBy "relevant" (sin autenticación)
      const { cupones: publicos } = await obtenerCuponesPublicos(
        undefined, // Sin filtro de categoría
        "relevant" // Ordenar por relevancia
      );

      const cuponesDto = publicos.map(publicToCuponDto);
      
      // Eliminar duplicados por MARCA
      const cuponesUnicosPorMarca = Array.from(
        new Map(cuponesDto.map((c) => [c.empresa.nombre, c])).values()
      );
      
      // Guardar todos los cupones para rotación
      setTodosLosCupones(cuponesUnicosPorMarca);
      
      // Mostrar 10 cupones aleatorios iniciales
      const cuponesIniciales = shuffleArray([...cuponesUnicosPorMarca]).slice(0, 10);
      setCupones(cuponesIniciales);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al cargar cupones";
      setError(errorMessage);
      console.error("Error al cargar cupones:", err);
    } finally {
      setLoading(false);
    }
  }

  // Función para mezclar array aleatoriamente (Fisher-Yates shuffle)
  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Manejar click en "Ver más descuentos"
  const handleVerMas = () => {
    if (clicsRestantes > 0) {
      // Aún tiene clics disponibles → mostrar 10 cupones aleatorios diferentes
      const nuevoCupones = shuffleArray([...todosLosCupones]).slice(0, 10);
      setCupones(nuevoCupones);
      setClicsRestantes(clicsRestantes - 1);
    } else {
      // Sin clics restantes → verificar autenticación
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      
      if (!token) {
        // No autenticado → redirigir a login
        router.push("/login");
      } else {
        // Autenticado → redirigir a dashboard
        router.push("/dashboard");
      }
    }
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Descubrí nuestro catálogo de descuentos
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Al donar, obtenés acceso a descuentos exclusivos en servicios que
            usas todos los días.
          </p>
        </div>

        {/* Bloque de cards: loading, error, vacío o grid */}
        <div className="min-h-[200px]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4" />
              <p className="text-gray-600">Cargando cupones...</p>
            </div>
          )}

          {!loading && error && (
            <div className="text-center bg-red-50 border-2 border-red-200 rounded-lg p-8">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold text-red-900 mb-2">
                Error al cargar cupones
              </h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {!loading && !error && cupones.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🎟️</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No hay cupones disponibles
              </h3>
              <p className="text-gray-600">
                Intentá nuevamente más tarde.
              </p>
            </div>
          )}

          {!loading && !error && cupones.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
                {cupones.map((cupon) => (
                  <CuponCard key={cupon.id} cupon={cupon} />
                ))}
              </div>

              {/* Botón "Ver más descuentos" */}
              <div className="flex justify-center mt-12">
                <button
                  onClick={handleVerMas}
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#16a459] to-emerald-600 text-white font-bold text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <span>Ver más descuentos</span>
                  <svg 
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
