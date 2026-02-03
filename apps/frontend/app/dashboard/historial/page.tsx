'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  obtenerHistorialCupones,
  HistorialCupones,
  formatearFechaCorta,
  obtenerColorEstado,
  obtenerEtiquetaEstado,
} from '@/lib/dashboard';

export default function HistorialPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [historial, setHistorial] = useState<HistorialCupones | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<
    'todos' | 'activo' | 'usado' | 'vencido' | 'cancelado'
  >('todos');
  const [paginaActual, setPaginaActual] = useState(1);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    cargarHistorial();
  }, [user, router, filtroEstado, paginaActual]);

  const cargarHistorial = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const data = await obtenerHistorialCupones(token, {
        pagina: paginaActual,
        limite: 20,
        estado: filtroEstado,
      });
      setHistorial(data);
    } catch (err: any) {
      console.error('Error al cargar historial:', err);
      setError(err.message || 'Error al cargar historial');
    } finally {
      setLoading(false);
    }
  };

  const cambiarPagina = (nuevaPagina: number) => {
    setPaginaActual(nuevaPagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && !historial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-2">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900"
            >
              ← Volver al Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Historial de Cupones
          </h1>
          <p className="text-gray-600 mt-1">
            {historial?.total || 0} cupones en total
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={cargarHistorial}
              className="mt-2 text-red-600 hover:text-red-700 font-medium"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Filtrar:</span>
            {['todos', 'activo', 'usado', 'vencido', 'cancelado'].map(
              (estado) => (
                <button
                  key={estado}
                  onClick={() => {
                    setFiltroEstado(
                      estado as typeof filtroEstado,
                    );
                    setPaginaActual(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filtroEstado === estado
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {estado.charAt(0).toUpperCase() + estado.slice(1)}
                </button>
              ),
            )}
          </div>
        </div>

        {historial && historial.cupones.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No hay cupones en el historial
            </h2>
            <p className="text-gray-600 mb-4">
              {filtroEstado === 'todos'
                ? 'Aún no has solicitado ningún cupón'
                : `No tienes cupones con estado "${filtroEstado}"`}
            </p>
            <Link
              href="/dashboard/cupones-disponibles"
              className="inline-block px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700"
            >
              Ver Catálogo de Cupones
            </Link>
          </div>
        ) : (
          <>
            {/* Tabla de historial */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cupón
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descuento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {historial?.cupones.map((cupon) => (
                    <tr key={cupon.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {cupon.nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            {cupon.empresaNombre}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {cupon.codigo ? (
                          <span className="font-mono text-sm font-medium text-gray-900">
                            {cupon.codigo}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          {cupon.descuento}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${obtenerColorEstado(cupon.estado)}`}
                        >
                          {obtenerEtiquetaEstado(cupon.estado)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatearFechaCorta(cupon.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {historial && historial.totalPaginas > 1 && (
              <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
                <div className="text-sm text-gray-600">
                  Página {historial.pagina} de {historial.totalPaginas}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => cambiarPagina(historial.pagina - 1)}
                    disabled={historial.pagina === 1 || loading}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Anterior
                  </button>
                  <button
                    onClick={() => cambiarPagina(historial.pagina + 1)}
                    disabled={
                      historial.pagina === historial.totalPaginas || loading
                    }
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
