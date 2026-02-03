'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { obtenerMisCupones, CuponSolicitado } from '@/lib/dashboard';
import CuponCard from '@/components/dashboard/CuponCard';

export default function MisCuponesPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [cupones, setCupones] = useState<CuponSolicitado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    cargarCupones();
  }, [user, router]);

  const cargarCupones = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const data = await obtenerMisCupones(token);
      setCupones(data);
    } catch (err: any) {
      console.error('Error al cargar cupones:', err);
      setError(err.message || 'Error al cargar cupones');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tus cupones...</p>
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
            Mis Cupones Activos
          </h1>
          <p className="text-gray-600 mt-1">
            {cupones.length} {cupones.length === 1 ? 'cupón activo' : 'cupones activos'}
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={cargarCupones}
              className="mt-2 text-red-600 hover:text-red-700 font-medium"
            >
              Reintentar
            </button>
          </div>
        )}

        {cupones.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-8xl mb-6">🎟️</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              No tienes cupones activos
            </h2>
            <p className="text-gray-600 text-lg mb-6">
              Solicita cupones del catálogo para empezar a disfrutar de
              descuentos exclusivos
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/dashboard/cupones-disponibles"
                className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700"
              >
                Ver Catálogo de Cupones
              </Link>
              <Link
                href="/dashboard/historial"
                className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300"
              >
                Ver Historial
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Filtros (futuro) */}
            <div className="mb-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando {cupones.length}{' '}
                {cupones.length === 1 ? 'cupón' : 'cupones'}
              </div>
              <button
                onClick={cargarCupones}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                🔄 Actualizar
              </button>
            </div>

            {/* Grid de cupones */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cupones.map((cupon) => (
                <CuponCard
                  key={cupon.id}
                  cupon={cupon}
                  token={token!}
                  onMarcarUsado={cargarCupones}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
