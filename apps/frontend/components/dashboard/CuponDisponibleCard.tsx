'use client';

import { useState } from 'react';

interface Cupon {
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

interface CuponDisponibleCardProps {
  cupon: Cupon;
  codigoAfiliado: string;
  micrositioSlug: string;
  token: string;
  onSolicitar?: () => void;
}

export default function CuponDisponibleCard({
  cupon,
  codigoAfiliado,
  micrositioSlug,
  token,
  onSolicitar,
}: CuponDisponibleCardProps) {
  const [solicitando, setSolicitando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSolicitar = async () => {
    try {
      setSolicitando(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/bonda/solicitar-cupon`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            bondaCuponId: cupon.id,
            codigoAfiliado,
            micrositioSlug,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al solicitar cupón');
      }

      setSuccess(true);
      setTimeout(() => {
        onSolicitar?.();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al solicitar cupón');
    } finally {
      setSolicitando(false);
    }
  };

  const imagenUrl =
    cupon.imagenes?.principal?.['280x190'] ||
    cupon.empresa.logoThumbnail?.['90x90'];

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Imagen */}
      {imagenUrl && (
        <div className="mb-4">
          <img
            src={imagenUrl}
            alt={cupon.nombre}
            className="w-full h-40 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Contenido */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">{cupon.nombre}</h3>
        <p className="text-sm text-gray-600 mb-2">{cupon.empresa.nombre}</p>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
          {cupon.descuento}
        </span>
      </div>

      {/* Botón de acción */}
      {!success ? (
        <button
          onClick={handleSolicitar}
          disabled={solicitando}
          className="w-full py-3 px-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {solicitando ? 'Solicitando...' : '🎟️ Solicitar Cupón'}
        </button>
      ) : (
        <div className="w-full py-3 px-4 bg-green-100 text-green-800 font-medium rounded-lg text-center">
          ✓ ¡Cupón solicitado! Revisa "Mis Cupones"
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}
