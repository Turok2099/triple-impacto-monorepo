'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { obtenerMisCupones, CuponSolicitado } from '@/lib/dashboard';

// Componente simple para mostrar cupones solicitados
function CuponCard({ cupon, token, onMarcarUsado }: { cupon: CuponSolicitado; token: string; onMarcarUsado: () => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 relative">
      {/* Bloque superior: imagen de fondo */}
      <div className="relative h-44 overflow-hidden bg-gray-100">
        <div className="w-full h-full flex items-center justify-center bg-emerald-100">
          <span className="text-5xl">🎟️</span>
        </div>
        {/* Estado del cupón */}
        <div className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-sm font-medium shadow-md">
          Activo
        </div>
      </div>

      {/* Contenido */}
      <div className="relative z-0 p-5 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Cupón #{cupon.id}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Código de cupón disponible
        </p>
        <button
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          Ver detalles
        </button>
      </div>
    </div>
  );
}

export default function MisCuponesPage() {
  const router = useRouter();
  const { user } = useAuth();
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
    const token = localStorage.getItem('auth_token');
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
                href="/dashboard"
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
                  token={localStorage.getItem('auth_token') || ''}
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
