'use client';

import { useEffect, useState } from 'react';
import { obtenerHistorialCupones, CuponSolicitado } from '@/lib/dashboard';
import { Ticket } from 'lucide-react';

export default function SeccionMisCupones() {
  const [cupones, setCupones] = useState<CuponSolicitado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarCupones();
  }, []);

  const cargarCupones = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      setLoading(true);
      const data = await obtenerHistorialCupones(token, { limite: 100, estado: 'todos' });
      setCupones(data.cupones);
    } catch (err) {
      console.error('Error al cargar cupones:', err);
    } finally {
      setLoading(false);
    }
  };

  const cuponesUsados = cupones.filter((c) => c.estado === 'usado');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#40a8ab] mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Cargando tu historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-12">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-[#1A202C] mb-2">Cupones Solicitados</h1>
        <p className="text-sm text-slate-500">Historial de cupones que has utilizado.</p>
      </div>

      {/* Lista */}
      <section className="px-6">
        {cuponesUsados.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-10 text-center mt-2">
            <div className="flex justify-center mb-4">
              <Ticket className="w-16 h-16 text-slate-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-[#2D3748] mb-2">
              No tenés cupones usados
            </h3>
            <p className="text-sm text-slate-500">
              Los cupones que utilices del catálogo aparecerán acá como tu récord.
            </p>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {cuponesUsados.map((cupon) => (
              <div
                key={cupon.id}
                className="rounded-2xl border p-5 shadow-sm bg-slate-50 border-slate-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm text-[#2D3748]">
                      {cupon.nombre || `Cupón #${cupon.id.slice(0, 8)}`}
                    </h3>
                    {cupon.empresaNombre && (
                      <p className="text-xs text-slate-500 mt-0.5">{cupon.empresaNombre}</p>
                    )}
                    {cupon.descuento && (
                      <span className="inline-block mt-1 text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                        {cupon.descuento}
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-[9px] text-slate-400 uppercase font-medium">
                      Usado
                    </p>
                    <p className="text-[11px] font-bold text-slate-600">
                      {new Date(cupon.usadoAt || cupon.createdAt).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
