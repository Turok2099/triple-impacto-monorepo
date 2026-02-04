"use client";

import { useState, useEffect } from "react";
import { CuponDto, PublicCouponDto } from "@/lib/types/cupon";
import { obtenerCuponesPublicos } from "@/lib/bonda";
import CuponCard from "./CuponCard";
import FiltrosCupones from "./FiltrosCupones";

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
  const [cupones, setCupones] = useState<CuponDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [categoriaActual, setCategoriaActual] = useState<number | null>(null);
  const [ordenActual, setOrdenActual] = useState<string>("relevant");

  useEffect(() => {
    cargarCupones();
  }, [categoriaActual, ordenActual]); // Recargar cuando cambian filtros

  async function cargarCupones() {
    try {
      setLoading(true);
      setError(null);

      // Llamar directamente a Bonda API con filtros
      // Micrositio: Fundación Padres
      const publicos = await obtenerCuponesPublicos(
        categoriaActual ?? undefined,
        (ordenActual as "relevant" | "latest") ?? "relevant"
      );

      const cuponesDto = publicos.map(publicToCuponDto);
      setCupones(cuponesDto);
      setCount(cuponesDto.length);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al cargar cupones";
      setError(errorMessage);
      console.error("Error al cargar cupones:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleFiltroChange = (categoria: number | null, orden: string) => {
    setCategoriaActual(categoria);
    setOrdenActual(orden);
    // El useEffect se encargará de recargar los cupones
  };

  if (loading) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
            <p className="text-gray-600">Cargando cupones...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center bg-red-50 border-2 border-red-200 rounded-lg p-8">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-2xl font-bold text-red-900 mb-2">
              Error al cargar cupones
            </h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (cupones.length === 0) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="text-6xl mb-4">🎟️</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No hay cupones disponibles
            </h3>
            <p className="text-gray-600">
              Próximamente tendremos más descuentos disponibles.
            </p>
          </div>
        </div>
      </section>
    );
  }

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

        {/* Filtros */}
        <FiltrosCupones onFiltroChange={handleFiltroChange} />

        {/* Grid de Cupones (más columnas = cards más angostas) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {cupones.map((cupon) => (
            <CuponCard key={cupon.id} cupon={cupon} />
          ))}
        </div>

        {/* Contador de resultados */}
        {!loading && (
          <div className="text-center mt-8 text-gray-600">
            Mostrando{" "}
            <span className="font-semibold text-emerald-600">{count}</span>{" "}
            cupones
            {categoriaActual && " filtrados"}
          </div>
        )}
      </div>
    </section>
  );
}
