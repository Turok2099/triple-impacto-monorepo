"use client";

import { useState, useEffect } from "react";

interface Categoria {
  id: number;
  nombre: string;
}

interface FiltrosCuponesProps {
  onFiltroChange: (categoria: number | null, orden: string) => void;
}

const ICONOS_CATEGORIAS: Record<string, string> = {
  Todos: "🎟️",
  Gastronomía: "🍔",
  Turismo: "✈️",
  Compras: "🛍️",
  "Belleza y Salud": "💄",
  "Indumentaria y Moda": "👕",
  Servicios: "🔧",
};

export default function FiltrosCupones({ onFiltroChange }: FiltrosCuponesProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number | null>(null);
  const [ordenSeleccionado, setOrdenSeleccionado] = useState<string>("relevant");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarCategorias();
  }, []);

  async function cargarCategorias() {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
      const response = await fetch(`${API_URL}/public/categorias`);
      const data = await response.json();
      setCategorias(data);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleCategoriaClick = (categoriaId: number) => {
    const nuevaCategoria = categoriaId === 0 ? null : categoriaId;
    setCategoriaSeleccionada(nuevaCategoria);
    onFiltroChange(nuevaCategoria, ordenSeleccionado);
  };

  const handleOrdenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoOrden = e.target.value;
    setOrdenSeleccionado(nuevoOrden);
    onFiltroChange(categoriaSeleccionada, nuevoOrden);
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
      {/* Contenedor de filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-2xl shadow-md p-4">
        
        {/* Botones de categorías */}
        <div className="flex flex-wrap gap-2 flex-1">
          {categorias.map((categoria) => {
            const isSelected = categoria.id === 0 
              ? categoriaSeleccionada === null 
              : categoriaSeleccionada === categoria.id;
            
            const icono = ICONOS_CATEGORIAS[categoria.nombre] || "🎯";
            
            return (
              <button
                key={categoria.id}
                onClick={() => handleCategoriaClick(categoria.id)}
                className={`
                  px-4 py-2 rounded-full font-semibold transition-all duration-200
                  flex items-center gap-2 text-sm sm:text-base
                  ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
                  }
                `}
              >
                <span>{icono}</span>
                <span>{categoria.nombre}</span>
              </button>
            );
          })}
        </div>

        {/* Dropdown de ordenamiento */}
        <div className="flex items-center gap-2">
          <label htmlFor="orden" className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Ordenar por:
          </label>
          <select
            id="orden"
            value={ordenSeleccionado}
            onChange={handleOrdenChange}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white cursor-pointer"
          >
            <option value="relevant">Más relevantes</option>
            <option value="latest">Más recientes</option>
          </select>
        </div>
      </div>
    </div>
  );
}
