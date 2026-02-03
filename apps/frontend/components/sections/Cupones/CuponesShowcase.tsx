"use client";

import { useState, useEffect } from "react";
import { CuponDto, PublicCouponDto } from "@/lib/types/cupon";
import { obtenerCuponesPublicos } from "@/lib/bonda";
import CuponCard from "./CuponCard";

/** Convierte cupón público al formato que usa CuponCard (sin códigos). */
function publicToCuponDto(p: PublicCouponDto): CuponDto {
  return {
    id: p.id,
    nombre: p.titulo,
    descuento: p.descuento ?? "",
    codigoAfiliado: "",
    micrositioId: "",
    incluirCodigo: "0",
    empresa: { id: "", nombre: p.empresa ?? p.titulo },
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

  useEffect(() => {
    async function cargarCupones() {
      try {
        setLoading(true);
        setError(null);

        // SIEMPRE mostrar cupones públicos en el home (independiente del login)
        // Los cupones para "usar" (con código) solo están en el dashboard
        const publicos = await obtenerCuponesPublicos();
        setCupones(publicos.map(publicToCuponDto));
        setCount(publicos.length);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error al cargar cupones";
        setError(errorMessage);
        console.error("Error al cargar cupones:", err);
      } finally {
        setLoading(false);
      }
    }

    cargarCupones();
  }, []); // Ya no depende de isAuthenticated ni microsite

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

        {/* Grid de Cupones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cupones.map((cupon) => (
            <CuponCard key={cupon.id} cupon={cupon} />
          ))}
        </div>
      </div>
    </section>
  );
}
