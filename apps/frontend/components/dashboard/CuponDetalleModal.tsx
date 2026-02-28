'use client';

import { useState } from 'react';
import { X, Copy, CheckCircle, ExternalLink, Ticket } from 'lucide-react';
import { solicitarCupon, CuponSolicitado } from '@/lib/dashboard';
import { PublicCouponDto } from '@/lib/bonda';

interface CuponDetalleModalProps {
  cupon: PublicCouponDto;
  codigoAfiliado: string;
  micrositioSlug: string;
  fundacionNombre: string;
  token: string;
  /** Si el usuario ya solicitó este cupón, se pasa directamente para mostrarlo */
  cuponYaSolicitado?: CuponSolicitado | null;
  onClose: () => void;
  onCuponSolicitado?: (cupon: CuponSolicitado) => void;
}

type Estado = 'detalle' | 'solicitando' | 'codigo_obtenido' | 'error';

export default function CuponDetalleModal({
  cupon,
  codigoAfiliado,
  micrositioSlug,
  fundacionNombre,
  token,
  cuponYaSolicitado,
  onClose,
  onCuponSolicitado,
}: CuponDetalleModalProps) {
  const [estado, setEstado] = useState<Estado>(
    cuponYaSolicitado ? 'codigo_obtenido' : 'detalle',
  );
  const [cuponObtenido, setCuponObtenido] = useState<CuponSolicitado | null>(
    cuponYaSolicitado ?? null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const handleSolicitar = async () => {
    setEstado('solicitando');
    setErrorMsg(null);

    try {
      const resultado = await solicitarCupon(
        {
          bondaCuponId: cupon.id,
          codigoAfiliado,
          micrositioSlug,
        },
        token,
      );

      setCuponObtenido(resultado);
      setEstado('codigo_obtenido');
      onCuponSolicitado?.(resultado);
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo obtener el código. Intentá de nuevo.');
      setEstado('error');
    }
  };

  const handleCopiar = async () => {
    if (!cuponObtenido?.codigo) return;
    try {
      await navigator.clipboard.writeText(cuponObtenido.codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // fallback silencioso
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 size-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <X className="w-4 h-4 text-slate-600" />
        </button>

        {/* Imagen del cupón */}
        <div className="relative h-48 bg-slate-100 overflow-hidden">
          <img
            src={
              cupon.imagen_url ||
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='190' viewBox='0 0 280 190'%3E%3Crect fill='%2310b981' width='280' height='190'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial,sans-serif' font-size='16' fill='%23fff' text-anchor='middle' dy='.3em'%3ECup%C3%B3n%3C/text%3E%3C/svg%3E"
            }
            alt={cupon.titulo}
            className="w-full h-full object-cover"
          />
          {/* Descuento sobre la imagen (izquierda) */}
          <div className="absolute top-3 left-3">
            <span className="bg-emerald-500 text-white text-base font-black size-16 rounded-full shadow-md flex items-center justify-center text-center leading-tight">
              {cupon.descuento}
            </span>
          </div>
        </div>

        {/* Logo empresa */}
        <div className="relative -mt-8 mx-6 flex items-end gap-4">
          <div className="size-16 rounded-2xl bg-white shadow-lg border border-slate-100 overflow-hidden flex items-center justify-center p-0.5">
            <img
              src={
                cupon.logo_empresa ||
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90' viewBox='0 0 90 90'%3E%3Crect fill='%23f3f4f6' rx='12' width='90' height='90'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial,sans-serif' font-size='24' fill='%236b7280' text-anchor='middle' dy='.3em'%3E%F0%9F%8E%81%3C/text%3E%3C/svg%3E"
              }
              alt={cupon.empresa || 'Logo'}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Contenido */}
        <div className="px-6 pt-4 pb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-1">{cupon.titulo}</h2>
          {cupon.descripcion && (
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">{cupon.descripcion}</p>
          )}

          {/* ── Estado: DETALLE ── */}
          {estado === 'detalle' && (
            <button
              onClick={handleSolicitar}
              className="w-full py-3.5 bg-[#16a459] hover:bg-[#12854a] text-white font-bold rounded-2xl transition-colors shadow-md shadow-[#16a459]/20 flex items-center justify-center gap-2"
            >
              <Ticket className="w-5 h-5" />
              Solicitar código de descuento
            </button>
          )}

          {/* ── Estado: SOLICITANDO ── */}
          {estado === 'solicitando' && (
            <div className="w-full py-3.5 bg-slate-100 rounded-2xl flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#16a459]" />
              <span className="text-slate-600 font-medium text-sm">Obteniendo tu código...</span>
            </div>
          )}

          {/* ── Estado: CÓDIGO OBTENIDO ── */}
          {estado === 'codigo_obtenido' && cuponObtenido && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#16a459]">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-bold">¡Código obtenido exitosamente!</span>
              </div>

              {/* Código destacado */}
              <div className="bg-[#E8F5EE] border border-[#16a459]/20 rounded-2xl p-4">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Tu código de descuento
                </p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-2xl font-mono font-black text-[#16a459] tracking-widest uppercase break-all">
                    {cuponObtenido.codigo}
                  </span>
                  <button
                    onClick={handleCopiar}
                    className={`shrink-0 size-10 rounded-full flex items-center justify-center transition-colors ${
                      copiado
                        ? 'bg-green-500 text-white'
                        : 'bg-[#16a459]/10 text-[#16a459] hover:bg-[#16a459]/20'
                    }`}
                  >
                    {copiado ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {copiado && (
                  <p className="text-xs text-green-600 font-medium mt-1">¡Copiado al portapapeles!</p>
                )}
              </div>

              {/* Instrucciones */}
              {cuponObtenido.mensaje && (
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3">
                  {cuponObtenido.mensaje}
                </p>
              )}

              {/* Acciones */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="/dashboard/mis-cupones"
                  className="py-3 bg-[#16a459] text-white text-sm font-bold rounded-xl text-center hover:bg-[#12854a] transition-colors"
                >
                  Ver mis cupones
                </a>
                <button
                  onClick={onClose}
                  className="py-3 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"
                >
                  Seguir viendo
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ── Estado: ERROR ── */}
          {estado === 'error' && (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                <p className="text-sm text-red-700 font-medium">{errorMsg}</p>
              </div>
              <button
                onClick={() => setEstado('detalle')}
                className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-colors text-sm"
              >
                Intentar de nuevo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
