"use client";

import { useState, useEffect } from "react";

interface Categoria {
  id: number;
  nombre: string;
}

interface FiltrosCuponesProps {
  onFiltroChange: (categoria: string | null, orden: string) => void;
}

/** Lista de subcategorías por si el API devuelve vacío o solo "Todo" (misma que backend). */
const CATEGORIAS_POR_DEFECTO: Categoria[] = [
  { id: 0, nombre: "Todo" },
  { id: 13, nombre: "Compras" },
  { id: 12, nombre: "Gastronomía" },
  { id: 6, nombre: "Indumentaria, Calzado y Moda" },
  { id: 14, nombre: "Educación" },
  { id: 8, nombre: "Servicios" },
  { id: 11, nombre: "Turismo" },
  { id: 16, nombre: "Gimnasios y Deportes" },
  { id: 7, nombre: "Belleza y Salud" },
  { id: 17, nombre: "Entretenimientos" },
  { id: 18, nombre: "Motos" },
  { id: 19, nombre: "Teatros" },
  { id: 20, nombre: "Autos" },
  { id: 21, nombre: "Cines" },
  { id: 22, nombre: "Inmobiliarias" },
  { id: 23, nombre: "Inmuebles" },
];

export default function FiltrosCupones({
  onFiltroChange,
}: FiltrosCuponesProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarCategorias();
  }, []);

  async function cargarCategorias() {
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
      const base = API_URL.replace(/\/$/, "");
      const response = await fetch(`${base}/public/categorias-bonda`);
      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      setCategorias(list.length > 1 ? list : CATEGORIAS_POR_DEFECTO);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      setCategorias(CATEGORIAS_POR_DEFECTO);
    } finally {
      setLoading(false);
    }
  }

  const handleCategoriaClick = (categoriaId: number, categoriaNombre: string) => {
    const nuevaCategoria = categoriaId === 0 ? null : categoriaNombre;
    setCategoriaSeleccionada(nuevaCategoria);
    onFiltroChange(nuevaCategoria, "relevant");
  };

  if (loading) {
    return (
      <div className="mb-8 flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Barra horizontal con scroll (estilo dashboard) */}
      <div className="relative mb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-thin py-2 pb-4">
          {categorias.map((categoria) => {
            const isSelected =
              categoria.id === 0
                ? categoriaSeleccionada === null
                : categoriaSeleccionada === categoria.nombre;

            return (
              <button
                key={categoria.id}
                onClick={() => handleCategoriaClick(categoria.id, categoria.nombre)}
                className={`shrink-0 whitespace-nowrap px-5 py-2 rounded-full font-bold text-sm transition-all ${
                  isSelected
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-emerald-100 hover:border-emerald-400"
                }`}
              >
                {categoria.nombre}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
