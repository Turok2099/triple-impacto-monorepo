'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { obtenerMisCupones, CuponSolicitado } from '@/lib/dashboard';
import { ChevronLeft, Copy, ExternalLink } from 'lucide-react';

export default function MisCuponesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [cupones, setCupones] = useState<CuponSolicitado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroHistorial, setFiltroHistorial] = useState<'all' | 'used' | 'expired'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    cargarCupones();
  }, [user, authLoading, router]);

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

  const copiarCodigo = async (codigo: string, cuponId: string) => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiedCode(cuponId);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Error al copiar código:', err);
    }
  };

  const cuponesActivos = cupones.filter(c => c.estado === 'activo');
  const cuponesHistorial = cupones.filter(c => c.estado !== 'activo');

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16a459] mx-auto mb-4"></div>
          <p className="text-[#2D3748]">Cargando tus cupones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden max-w-[430px] mx-auto bg-white">
      {/* Header Sticky */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-4 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-[#2D3748] hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-[#2D3748]">
            Mis Cupones e Historial
          </h1>
        </div>
      </header>

      {/* Sección de Cupones Activos */}
      <section className="px-4 py-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#2D3748]">Cupones Activos</h2>
          <span className="bg-[#16a459]/10 text-[#16a459] text-[10px] font-bold px-2 py-1 rounded-full uppercase">
            {cuponesActivos.length} Disponibles
          </span>
        </div>

        {cuponesActivos.length === 0 ? (
          <div className="rounded-2xl bg-[#E8F5EE] border border-[#16a459]/20 p-8 text-center">
            <div className="text-6xl mb-4">🎟️</div>
            <h3 className="text-lg font-bold text-[#2D3748] mb-2">
              No tienes cupones activos
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Solicita cupones del catálogo para empezar a disfrutar
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-[#16a459] text-white text-sm font-bold py-3 px-6 rounded-xl shadow-sm"
            >
              Ver Catálogo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {cuponesActivos.map((cupon, index) => (
              <div
                key={cupon.id}
                className={`rounded-2xl ${
                  index === 0
                    ? 'bg-[#E8F5EE] border-[#16a459]/20'
                    : 'bg-slate-50 border-slate-200'
                } border p-5 shadow-sm relative overflow-hidden`}
              >
                {/* Header del cupón */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-12 rounded-xl bg-white flex items-center justify-center shadow-sm border ${
                        index === 0 ? 'border-[#16a459]/10' : 'border-slate-100'
                      } overflow-hidden`}
                    >
                      <span className="text-2xl">🎟️</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">Cupón #{cupon.id}</h3>
                      <p className="text-[10px] text-[#16a459] font-bold uppercase tracking-wide">
                        Estado: Activo
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-500 font-medium uppercase">
                      Solicitado
                    </p>
                    <p className="text-[11px] font-bold">
                      {new Date(cupon.fecha_solicitud).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {/* Código del cupón */}
                {cupon.codigo && (
                  <div
                    className={`bg-white rounded-lg p-3 border border-dashed ${
                      index === 0 ? 'border-[#16a459]/30' : 'border-slate-200'
                    } flex justify-between items-center mb-4`}
                  >
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase font-bold text-slate-400">
                        Código del Cupón
                      </span>
                      <span
                        className={`text-lg font-mono font-black ${
                          index === 0 ? 'text-[#16a459]' : 'text-slate-500'
                        } tracking-widest uppercase`}
                      >
                        {cupon.codigo}
                      </span>
                    </div>
                    <button
                      onClick={() => copiarCodigo(cupon.codigo!, cupon.id)}
                      className={`size-8 rounded-full ${
                        copiedCode === cupon.id
                          ? 'bg-green-100 text-green-600'
                          : index === 0
                          ? 'bg-[#16a459]/10 text-[#16a459]'
                          : 'bg-slate-100 text-slate-400'
                      } flex items-center justify-center transition-colors`}
                    >
                      {copiedCode === cupon.id ? (
                        <span className="text-xs">✓</span>
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}

                {/* Instrucciones */}
                {cupon.instrucciones && (
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    {cupon.instrucciones}
                  </p>
                )}

                {/* Botones de acción */}
                <div className="grid grid-cols-2 gap-3">
                  <button className="bg-[#16a459] text-white text-xs font-bold py-3 rounded-xl shadow-sm hover:bg-[#16a459]/90 transition-colors">
                    Marcar como Usado
                  </button>
                  <button className="bg-white border border-[#16a459]/20 text-[#16a459] text-xs font-bold py-3 rounded-xl shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-1">
                    Ir al Sitio
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sección de Historial */}
      <section className="px-4 py-8">
        <h2 className="text-lg font-bold text-[#2D3748] mb-4">Cupones Pasados</h2>

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFiltroHistorial('all')}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-colors ${
              filtroHistorial === 'all'
                ? 'bg-[#16a459] text-white'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltroHistorial('used')}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-colors ${
              filtroHistorial === 'used'
                ? 'bg-[#16a459] text-white'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            Usados
          </button>
          <button
            onClick={() => setFiltroHistorial('expired')}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-colors ${
              filtroHistorial === 'expired'
                ? 'bg-[#16a459] text-white'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            Vencidos
          </button>
        </div>

        {/* Tabla de historial */}
        {cuponesHistorial.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">No hay cupones en el historial</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {/* Header de la tabla */}
            <div className="grid grid-cols-12 px-2 py-3 bg-slate-50 rounded-t-lg border-b border-slate-100">
              <div className="col-span-5 text-[10px] font-bold text-slate-400 uppercase">
                Cupón & Fecha
              </div>
              <div className="col-span-4 text-[10px] font-bold text-slate-400 uppercase">
                Usado En
              </div>
              <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase text-right">
                Estado
              </div>
            </div>

            {/* Filas de la tabla */}
            {cuponesHistorial.map((cupon) => (
              <div
                key={cupon.id}
                className="grid grid-cols-12 px-2 py-4 border-b border-slate-50 items-center"
              >
                <div className="col-span-5">
                  <p className="text-xs font-bold text-[#2D3748]">Cupón #{cupon.id}</p>
                  <p className="text-[9px] text-slate-400">
                    Req:{' '}
                    {new Date(cupon.fecha_solicitud).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="col-span-4">
                  <p className="text-[10px] text-slate-600 font-medium">
                    {cupon.fecha_uso
                      ? new Date(cupon.fecha_uso).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
                <div className="col-span-3 text-right">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                      cupon.estado === 'usado'
                        ? 'text-slate-400 bg-slate-100'
                        : cupon.estado === 'vencido'
                        ? 'text-red-400 bg-red-50'
                        : 'text-yellow-600 bg-yellow-50'
                    }`}
                  >
                    {cupon.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
