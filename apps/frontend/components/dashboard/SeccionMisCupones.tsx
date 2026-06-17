'use client';

import { useEffect, useState } from 'react';
import { obtenerHistorialCupones, CuponSolicitado } from '@/lib/dashboard';
import { Ticket, X, Calendar, ArrowRight, Shield } from 'lucide-react';

interface SeccionMisCuponesProps {
  isOpen: boolean;
  onClose: () => void;
  isBlocked?: boolean;
}

export default function SeccionMisCupones({ isOpen, onClose, isBlocked = false }: SeccionMisCuponesProps) {
  const [cupones, setCupones] = useState<CuponSolicitado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && !isBlocked) {
      cargarCupones();
    }
  }, [isOpen, isBlocked]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div className="absolute inset-0 overflow-hidden">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out" 
          onClick={onClose}
        ></div>

        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          {/* Drawer Panel */}
          <div className="pointer-events-auto w-screen max-w-md transform bg-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col h-full border-l border-slate-100">
            {/* Header */}
            <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2" id="slide-over-title">
                  <Ticket className="w-5 h-5 text-[#40a8ab]" />
                  Historial de Cupones
                </h2>
                <p className="text-xs text-slate-500 mt-1">Récord de beneficios que has disfrutado</p>
              </div>
              <button
                type="button"
                className="rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors outline-none"
                onClick={onClose}
              >
                <span className="sr-only">Cerrar panel</span>
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 hide-scrollbar">
              {isBlocked ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 py-12">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 text-slate-400 border border-slate-100">
                    <Shield className="w-8 h-8" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">
                    Historial no disponible
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    Para acceder al historial debes estar registrado y tener una donación activa.
                  </p>
                </div>
              ) : loading ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#40a8ab] mb-3" />
                  <p className="text-slate-400 text-xs font-medium">Cargando historial...</p>
                </div>
              ) : cuponesUsados.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 text-slate-400 border border-slate-100">
                    <Ticket className="w-8 h-8" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">
                    No tienes cupones usados
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    Los descuentos que uses en el catálogo se guardarán aquí automáticamente.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cuponesUsados.map((cupon) => (
                    <div
                      key={cupon.id}
                      className="group bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all hover:border-[#40a8ab]/20"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-800 text-sm group-hover:text-[#40a8ab] transition-colors leading-tight">
                            {cupon.nombre || `Cupón #${cupon.id.slice(0, 8)}`}
                          </h4>
                          {cupon.empresaNombre && (
                            <p className="text-xs font-semibold text-slate-400">{cupon.empresaNombre}</p>
                          )}
                          {cupon.descuento && (
                            <div className="inline-flex mt-1">
                              <span className="text-[10px] font-bold bg-[#40a8ab]/10 text-[#40a8ab] px-2.5 py-0.5 rounded-full">
                                {cupon.descuento}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Usado
                          </span>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold justify-end">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(cupon.usadoAt || cupon.createdAt).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-6 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                Volver a la cuponera
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
