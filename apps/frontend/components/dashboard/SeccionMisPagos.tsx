'use client';

import { useEffect, useState } from 'react';
import { obtenerMisDonaciones, DonacionResumen } from '@/lib/dashboard';
import { Receipt, Heart, Calendar, Building2, CreditCard } from 'lucide-react';
import Link from 'next/link';

function formatMoneda(moneda: string): string {
  // Código numérico ISO 4217: 032 = ARS
  if (moneda === '032' || moneda === 'ARS') return 'ARS';
  return moneda;
}

function formatMonto(monto: string, moneda: string): string {
  const num = parseFloat(monto);
  if (Number.isNaN(num)) return monto;
  const symbol = formatMoneda(moneda) === 'ARS' ? '$' : '';
  return `${symbol}${num.toLocaleString('es-AR')}`;
}

export default function SeccionMisPagos() {
  const [donaciones, setDonaciones] = useState<DonacionResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarDonaciones();
  }, []);

  const cargarDonaciones = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await obtenerMisDonaciones(token);
      setDonaciones(data);
    } catch (err) {
      console.error('Error al cargar pagos:', err);
      setError('No se pudieron cargar tus pagos. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const totalDonado = donaciones.reduce(
    (sum, d) => sum + parseFloat(d.monto || '0'),
    0,
  );
  const totalFormateado = totalDonado.toLocaleString('es-AR');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#16a459] mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Cargando tus pagos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-[#1A202C] mb-5">
          Mis pagos
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Resumen de todas tus donaciones realizadas por la plataforma.
        </p>

        {/* Resumen */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-1">
              <Receipt className="w-5 h-5 text-[#16a459]" strokeWidth={1.5} />
              <span className="text-[10px] font-semibold text-[#718096] uppercase tracking-tight">
                Total de pagos
              </span>
            </div>
            <p className="text-2xl font-bold text-[#16a459]">
              {donaciones.length}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-5 h-5 text-[#16a459]" strokeWidth={1.5} />
              <span className="text-[10px] font-semibold text-[#718096] uppercase tracking-tight">
                Total donado
              </span>
            </div>
            <p className="text-2xl font-bold text-[#16a459]">
              ${totalFormateado}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-6 mb-4">
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        </div>
      )}

      <section className="px-6">
        {donaciones.length === 0 ? (
          <div className="rounded-2xl bg-[#E8F5EE] border border-[#16a459]/20 p-10 text-center mt-2">
            <div className="flex justify-center mb-4">
              <CreditCard className="w-16 h-16 text-[#16a459]" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-[#2D3748] mb-2">
              Aún no tenés pagos registrados
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              Cuando realices una donación, aparecerá acá para que puedas llevar el control.
            </p>
            <Link
              href="/donar"
              className="inline-block px-6 py-3 bg-[#16a459] text-white rounded-full text-sm font-bold hover:bg-[#12854a] transition-colors"
            >
              Donar ahora
            </Link>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {donaciones.map((d) => (
              <div
                key={d.id}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.5} />
                      <span className="font-bold text-sm text-[#2D3748] truncate">
                        {d.organizacion_nombre || 'Donación'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                      <span className="text-xs">
                        {new Date(d.created_at).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {d.payment_id && (
                      <p className="text-[10px] text-slate-400 mt-2 font-mono">
                        ID pago: {d.payment_id}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-[#16a459]">
                      {formatMonto(d.monto, d.moneda)}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-medium text-slate-400 uppercase">
                      {d.metodo_pago || 'Pago'}
                    </span>
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
