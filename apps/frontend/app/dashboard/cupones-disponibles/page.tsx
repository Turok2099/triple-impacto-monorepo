'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { obtenerCuponesPublicos, obtenerCategorias, PublicCouponDto } from '@/lib/bonda';
import { CategoriaDto, CuponDto } from '@/lib/types/cupon';
import CuponCard from '@/components/sections/Cupones/CuponCard';

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

export default function CuponesDisponiblesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [cupones, setCupones] = useState<PublicCouponDto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDto[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const cuPONES_POR_PAGINA = 10;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    cargarCategorias();
    cargarCupones();
  }, [user, authLoading, router]);

  useEffect(() => {
    cargarCupones();
  }, [categoriaSeleccionada]);

  const cargarCategorias = async () => {
    try {
      const cats = await obtenerCategorias();
      setCategorias([{ id: 0, nombre: 'Todo', parent_id: null }, ...cats]);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const cargarCupones = async () => {
    try {
      setLoading(true);
      const data = await obtenerCuponesPublicos(
        categoriaSeleccionada || undefined,
        'relevant'
      );
      setCupones(data);
      setPaginaActual(1); // Reset a la primera página cuando cambia el filtro
    } catch (error) {
      console.error('Error al cargar cupones:', error);
    } finally {
      setLoading(false);
    }
  };

  const cuponesPaginados = cupones.slice(
    (paginaActual - 1) * cuPONES_POR_PAGINA,
    paginaActual * cuPONES_POR_PAGINA
  );

  const totalPaginas = Math.ceil(cupones.length / cuPONES_POR_PAGINA);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando cupones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Volver
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            🎁 Catálogo de Cupones
          </h1>
          <p className="text-gray-600 mt-1">
            Explora y solicita cupones de descuento
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="container mx-auto px-4 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="font-bold text-gray-900 mb-4">Filtrar por categoría</h2>
          <div className="flex flex-wrap gap-2">
            {categorias.map((categoria) => (
              <button
                key={categoria.id}
                onClick={() =>
                  setCategoriaSeleccionada(
                    categoria.id === 0 ? null : categoria.nombre
                  )
                }
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  (categoria.id === 0 && !categoriaSeleccionada) ||
                  categoria.nombre === categoriaSeleccionada
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {categoria.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Información */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600">
            Mostrando {cuponesPaginados.length} de {cupones.length} cupones
            {categoriaSeleccionada && ` en "${categoriaSeleccionada}"`}
          </p>
          {totalPaginas > 1 && (
            <p className="text-gray-600">
              Página {paginaActual} de {totalPaginas}
            </p>
          )}
        </div>

        {/* Grid de Cupones */}
        {cuponesPaginados.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No hay cupones en esta categoría
            </h3>
            <p className="text-gray-600 mb-4">
              Intenta con otra categoría o vuelve más tarde
            </p>
            <button
              onClick={() => setCategoriaSeleccionada(null)}
              className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700"
            >
              Ver todos los cupones
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cuponesPaginados.map((cupon) => (
                <CuponCard key={cupon.id} cupon={publicToCuponDto(cupon)} />
              ))}
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Anterior
                </button>

                <div className="flex gap-2">
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                    <button
                      key={pagina}
                      onClick={() => setPaginaActual(pagina)}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        pagina === paginaActual
                          ? 'bg-purple-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pagina}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
