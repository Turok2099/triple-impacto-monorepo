'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import CuponDisponibleCard from '@/components/dashboard/CuponDisponibleCard';

// Tipo para cupones de Bonda
interface CuponBonda {
  id: string;
  nombre: string;
  descuento: string;
  empresa: {
    id: string;
    nombre: string;
    logoThumbnail?: any;
  };
  imagenes?: {
    principal?: any;
  };
}

export default function CuponesDisponiblesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [cupones, setCupones] = useState<CuponBonda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Para las pruebas, usamos el código de afiliado hardcoded
  const CODIGO_AFILIADO = '22380612';
  const MICROSITIO_SLUG = 'beneficios-fundacion-padres';

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    cargarCuponesDisponibles();
  }, [user, router]);

  const cargarCuponesDisponibles = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      // Obtener cupones de Bonda
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/bonda/cupones?microsite=${MICROSITIO_SLUG}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Error al cargar cupones disponibles');
      }

      const data = await response.json();
      setCupones(data.cupones || []);
    } catch (err: any) {
      console.error('Error al cargar cupones disponibles:', err);
      setError(err.message || 'Error al cargar cupones disponibles');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando cupones disponibles...</p>
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
            Catálogo de Cupones
          </h1>
          <p className="text-gray-600 mt-1">
            {cupones.length} cupones disponibles en Beneficios Fundación Padres
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={cargarCuponesDisponibles}
              className="mt-2 text-red-600 hover:text-red-700 font-medium"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Banner informativo */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white mb-8">
          <div className="flex items-start gap-4">
            <div className="text-4xl">ℹ️</div>
            <div>
              <h2 className="text-xl font-bold mb-2">
                ¿Cómo funciona la solicitud de cupones?
              </h2>
              <ul className="space-y-1 text-purple-100">
                <li>
                  ✓ Haz clic en "Solicitar Cupón" en el cupón que te interese
                </li>
                <li>
                  ✓ El cupón se agregará a "Mis Cupones" con el código visible
                </li>
                <li>✓ Podrás ver y copiar el código cuando lo necesites</li>
                <li>
                  ✓ Marca el cupón como "usado" después de utilizarlo en el
                  comercio
                </li>
              </ul>
            </div>
          </div>
        </div>

        {cupones.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🎁</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No hay cupones disponibles en este momento
            </h2>
            <p className="text-gray-600 mb-4">
              Por favor, intenta más tarde o verifica que tu afiliación esté
              activa
            </p>
            <button
              onClick={cargarCuponesDisponibles}
              className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700"
            >
              🔄 Actualizar
            </button>
          </div>
        ) : (
          <>
            {/* Header de resultados */}
            <div className="mb-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando {cupones.length}{' '}
                {cupones.length === 1 ? 'cupón' : 'cupones'}
              </div>
              <button
                onClick={cargarCuponesDisponibles}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                🔄 Actualizar
              </button>
            </div>

            {/* Grid de cupones disponibles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cupones.map((cupon) => (
                <CuponDisponibleCard
                  key={cupon.id}
                  cupon={cupon}
                  codigoAfiliado={CODIGO_AFILIADO}
                  micrositioSlug={MICROSITIO_SLUG}
                  token={localStorage.getItem('auth_token') || ''}
                  onSolicitar={cargarCuponesDisponibles}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
