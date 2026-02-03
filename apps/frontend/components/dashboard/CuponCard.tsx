'use client';

import { useState } from 'react';
import {
  CuponSolicitado,
  copiarAlPortapapeles,
  obtenerColorEstado,
  obtenerEtiquetaEstado,
  formatearFechaCorta,
  marcarCuponComoUsado,
} from '@/lib/dashboard';

interface CuponCardProps {
  cupon: CuponSolicitado;
  token: string;
  onMarcarUsado?: () => void;
}

export default function CuponCard({
  cupon,
  token,
  onMarcarUsado,
}: CuponCardProps) {
  const [copiando, setCopiando] = useState(false);
  const [marcandoUsado, setMarcandoUsado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopiarCodigo = async () => {
    if (!cupon.codigo) return;

    setCopiando(true);
    const success = await copiarAlPortapapeles(cupon.codigo);

    if (success) {
      // Mostrar feedback visual
      setTimeout(() => setCopiando(false), 2000);
    } else {
      setCopiando(false);
      setError('Error al copiar el código');
    }
  };

  const handleMarcarUsado = async () => {
    if (cupon.estado !== 'activo') return;

    try {
      setMarcandoUsado(true);
      setError(null);
      await marcarCuponComoUsado(cupon.id, token);
      onMarcarUsado?.();
    } catch (err: any) {
      setError(err.message || 'Error al marcar cupón como usado');
    } finally {
      setMarcandoUsado(false);
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Header con imagen y nombre */}
      <div className="flex items-start gap-4 mb-4">
        {cupon.imagenPrincipal && (
          <img
            src={cupon.imagenPrincipal}
            alt={cupon.nombre}
            className="w-24 h-24 object-cover rounded-lg"
          />
        )}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {cupon.nombre}
          </h3>
          <p className="text-sm text-gray-600 mb-2">{cupon.empresaNombre}</p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              {cupon.descuento}
            </span>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${obtenerColorEstado(cupon.estado)}`}
            >
              {obtenerEtiquetaEstado(cupon.estado)}
            </span>
          </div>
        </div>
      </div>

      {/* Código del cupón (lo más importante!) */}
      {cupon.codigo && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-gray-600 mb-1 uppercase font-medium">
                Código del Cupón
              </p>
              <p className="text-2xl font-mono font-bold text-gray-900 tracking-wider">
                {cupon.codigo}
              </p>
            </div>
            <button
              onClick={handleCopiarCodigo}
              disabled={copiando}
              className={`ml-4 px-4 py-2 rounded-lg font-medium transition-all ${
                copiando
                  ? 'bg-green-500 text-white'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {copiando ? '✓ Copiado' : '📋 Copiar'}
            </button>
          </div>
        </div>
      )}

      {/* Mensaje/Instrucciones */}
      {cupon.mensaje && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
          <p className="text-sm text-blue-800">{cupon.mensaje}</p>
        </div>
      )}

      {/* Footer con acciones y fecha */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p>Solicitado: {formatearFechaCorta(cupon.createdAt)}</p>
          {cupon.usadoAt && (
            <p>Usado: {formatearFechaCorta(cupon.usadoAt)}</p>
          )}
          {cupon.expiresAt && (
            <p>Vence: {formatearFechaCorta(cupon.expiresAt)}</p>
          )}
        </div>

        {cupon.estado === 'activo' && (
          <button
            onClick={handleMarcarUsado}
            disabled={marcandoUsado}
            className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
          >
            {marcandoUsado ? 'Marcando...' : '✓ Marcar como usado'}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}
