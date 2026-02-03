'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { obtenerDashboard, DashboardUsuario } from '@/lib/dashboard';
import EstadisticasCard from '@/components/dashboard/EstadisticasCard';
import CuponCard from '@/components/dashboard/CuponCard';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardUsuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    cargarDashboard();
  }, [user, router]);

  const cargarDashboard = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const data = await obtenerDashboard(token);
      setDashboard(data);
    } catch (err: any) {
      console.error('Error al cargar dashboard:', err);
      setError(err.message || 'Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error al cargar
            </h2>
            <p className="text-gray-600 mb-4">
              {error || 'No se pudo cargar el dashboard'}
            </p>
            <button
              onClick={cargarDashboard}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            ¡Hola, {dashboard.usuario.nombre}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Bienvenido a tu dashboard de cupones
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="container mx-auto px-4 py-8">
        {/* Estadísticas */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Tus Estadísticas
          </h2>
          <EstadisticasCard estadisticas={dashboard.estadisticas} />
        </div>

        {/* Cupones Activos */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Cupones Activos ({dashboard.cuponesActivos.length})
            </h2>
            <Link
              href="/dashboard/mis-cupones"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Ver todos →
            </Link>
          </div>

          {dashboard.cuponesActivos.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-6xl mb-4">🎟️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No tienes cupones activos
              </h3>
              <p className="text-gray-600 mb-4">
                Solicita cupones del catálogo para empezar a ahorrar
              </p>
              <Link
                href="/dashboard/cupones-disponibles"
                className="inline-block px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700"
              >
                Ver Catálogo de Cupones
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboard.cuponesActivos.slice(0, 3).map((cupon) => (
                <CuponCard
                  key={cupon.id}
                  cupon={cupon}
                  token={token!}
                  onMarcarUsado={cargarDashboard}
                />
              ))}
            </div>
          )}
        </div>

        {/* Cupones Recientes */}
        {dashboard.cuponesRecientes.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Cupones Recientes
              </h2>
              <Link
                href="/dashboard/historial"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Ver historial completo →
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cupón
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
                  {dashboard.cuponesRecientes.map((cupon) => (
                    <tr key={cupon.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          {cupon.descuento}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            cupon.estado === 'activo'
                              ? 'bg-green-100 text-green-800'
                              : cupon.estado === 'usado'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {cupon.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(cupon.createdAt).toLocaleDateString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Enlaces rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/dashboard/cupones-disponibles"
            className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-2">🎁</div>
            <h3 className="text-xl font-bold mb-2">Catálogo de Cupones</h3>
            <p className="text-purple-100">
              Explora todos los cupones disponibles
            </p>
          </Link>

          <Link
            href="/dashboard/mis-cupones"
            className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-6 text-white hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-2">🎟️</div>
            <h3 className="text-xl font-bold mb-2">Mis Cupones</h3>
            <p className="text-blue-100">Ver todos tus cupones activos</p>
          </Link>

          <Link
            href="/dashboard/historial"
            className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-6 text-white hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-2">📊</div>
            <h3 className="text-xl font-bold mb-2">Historial</h3>
            <p className="text-green-100">Revisa tus cupones anteriores</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
