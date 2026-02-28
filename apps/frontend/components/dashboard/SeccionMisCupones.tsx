'use client';

import { useEffect, useState } from 'react';
import { obtenerHistorialCupones, marcarCuponComoUsado, CuponSolicitado } from '@/lib/dashboard';
import { Copy, CheckCircle, Ticket } from 'lucide-react';

export default function SeccionMisCupones() {
  const [cupones, setCupones] = useState<CuponSolicitado[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [marcandoUsado, setMarcandoUsado] = useState<string | null>(null);
  const [tab, setTab] = useState<'activos' | 'usados'>('activos');

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

  const handleMarcarUsado = async (cuponId: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    setMarcandoUsado(cuponId);
    try {
      await marcarCuponComoUsado(cuponId, token);
      setCupones((prev) =>
        prev.map((c) =>
          c.id === cuponId ? { ...c, estado: 'usado' as const, usadoAt: new Date().toISOString() } : c,
        ),
      );
    } catch (err) {
      console.error('Error al marcar cupón como usado:', err);
    } finally {
      setMarcandoUsado(null);
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

  const cuponesActivos = cupones.filter((c) => c.estado === 'activo');
  const cuponesUsados = cupones.filter((c) => c.estado === 'usado');
  const lista = tab === 'activos' ? cuponesActivos : cuponesUsados;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#16a459] mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Cargando tus cupones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-12">
      {/* Header + Tabs */}
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-[#1A202C] mb-5">Mis Cupones</h1>
        <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
          <button
            onClick={() => setTab('activos')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === 'activos' ? 'bg-white text-[#16a459] shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Activos
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-black ${
              tab === 'activos' ? 'bg-[#16a459]/10 text-[#16a459]' : 'bg-slate-200 text-slate-500'
            }`}>
              {cuponesActivos.length}
            </span>
          </button>
          <button
            onClick={() => setTab('usados')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === 'usados' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Usados
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-black ${
              tab === 'usados' ? 'bg-slate-100 text-slate-600' : 'bg-slate-200 text-slate-500'
            }`}>
              {cuponesUsados.length}
            </span>
          </button>
        </div>
      </div>

      {/* Lista */}
      <section className="px-6">
        {lista.length === 0 ? (
          <div className="rounded-2xl bg-[#E8F5EE] border border-[#16a459]/20 p-10 text-center mt-2">
            <div className="flex justify-center mb-4">
              <Ticket className="w-16 h-16 text-[#16a459]" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-[#2D3748] mb-2">
              {tab === 'activos' ? 'No tenés cupones activos' : 'No tenés cupones usados'}
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              {tab === 'activos'
                ? 'Solicitá cupones del catálogo para empezar a disfrutar'
                : 'Los cupones que uses aparecerán acá'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {lista.map((cupon) => (
              <div
                key={cupon.id}
                className={`rounded-2xl border p-5 shadow-sm ${
                  tab === 'activos' ? 'bg-[#E8F5EE] border-[#16a459]/20' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-sm text-[#2D3748]">
                      {cupon.nombre || `Cupón #${cupon.id.slice(0, 8)}`}
                    </h3>
                    {cupon.empresaNombre && (
                      <p className="text-xs text-slate-500 mt-0.5">{cupon.empresaNombre}</p>
                    )}
                    {cupon.descuento && (
                      <span className="inline-block mt-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        {cupon.descuento}
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-[9px] text-slate-400 uppercase font-medium">
                      {tab === 'activos' ? 'Solicitado' : 'Usado'}
                    </p>
                    <p className="text-[11px] font-bold text-slate-600">
                      {new Date(
                        tab === 'activos' ? cupon.createdAt : (cupon.usadoAt || cupon.createdAt),
                      ).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {cupon.codigo && (
                  <div className={`bg-white rounded-xl p-3 border border-dashed mb-3 flex justify-between items-center ${
                    tab === 'activos' ? 'border-[#16a459]/30' : 'border-slate-200'
                  }`}>
                    <div>
                      <p className="text-[8px] uppercase font-bold text-slate-400 mb-0.5">Código de descuento</p>
                      <p className={`text-base font-mono font-black tracking-widest uppercase ${
                        tab === 'activos' ? 'text-[#16a459]' : 'text-slate-400 line-through'
                      }`}>
                        {cupon.codigo}
                      </p>
                    </div>
                    {tab === 'activos' && (
                      <button
                        onClick={() => copiarCodigo(cupon.codigo!, cupon.id)}
                        className={`size-8 rounded-full flex items-center justify-center transition-colors ${
                          copiedCode === cupon.id
                            ? 'bg-green-100 text-green-600'
                            : 'bg-[#16a459]/10 text-[#16a459] hover:bg-[#16a459]/20'
                        }`}
                      >
                        {copiedCode === cupon.id ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                )}

                {cupon.mensaje && tab === 'activos' && (
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">{cupon.mensaje}</p>
                )}

                {tab === 'activos' && (
                  <button
                    onClick={() => handleMarcarUsado(cupon.id)}
                    disabled={marcandoUsado === cupon.id}
                    className="w-full py-2.5 bg-[#16a459] hover:bg-[#12854a] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    {marcandoUsado === cupon.id ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Marcar como Usado
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
