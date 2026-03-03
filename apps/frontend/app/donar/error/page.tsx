'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle, Loader2, Mail, ShieldAlert, ArrowRight, Home } from 'lucide-react';

function PagoErrorContent() {
  const searchParams = useSearchParams();

  const failReason = searchParams.get('failReason') || searchParams.get('fail_reason');
  const responseCode = searchParams.get('response_code');
  const oid = searchParams.get('oid');

  const getMensajeError = (reason?: string | null, code?: string | null) => {
    if (reason?.toLowerCase().includes('cancel')) {
      return {
        titulo: 'Operación Cancelada',
        descripcion: 'Cancelaste el proceso de pago seguro. No se realizó ningún cargo a tu tarjeta.',
      };
    }

    if (code === '202' || reason?.toLowerCase().includes('declined')) {
      return {
        titulo: 'Pago Rechazado',
        descripcion: 'Tu banco rechazó la transacción. Por favor, verifica tus datos o intenta con otro medio.',
      };
    }

    if (code === '203' || reason?.toLowerCase().includes('insufficient')) {
      return {
        titulo: 'Fondos Insuficientes',
        descripcion: 'La tarjeta no tiene fondos o límite suficiente para completar esta operación.',
      };
    }

    return {
      titulo: 'Falla en la plataforma',
      descripcion: 'El procesador Fiserv declinó temporalmente la interacción. No te preocupes, no se ha debitado nada.',
    };
  };

  const errorInfo = getMensajeError(failReason, responseCode);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="max-w-xl w-full">
        {/* Mensaje de error principal */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="bg-[#e11d48] p-8 text-center text-white flex flex-col items-center">
            <XCircle className="w-16 h-16 mb-4 text-white" strokeWidth={1.5} />
            <h1 className="text-2xl font-bold mb-1">{errorInfo.titulo}</h1>
            <p className="text-rose-100 text-sm font-medium">{errorInfo.descripcion}</p>
          </div>

          {/* Contenido */}
          <div className="p-8">
            {/* Información técnica (si disponible) */}
            {(failReason || responseCode || oid) && (
              <div className="mb-8 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Registro Técnico
                </h2>
                <div className="space-y-2 text-sm text-slate-700">
                  {oid && (
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-500">Ref. Fiserv (OID)</span>
                      <span className="font-mono text-xs max-w-[150px] truncate">{oid}</span>
                    </div>
                  )}
                  {responseCode && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-medium text-slate-500">Código interno</span>
                      <span className="font-mono">{responseCode}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Aviso central de seguridad */}
            <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-5 mb-8 flex gap-3 text-sm text-rose-800">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-500" />
              <p className="font-medium">Ningún débito ha sido aplicado. Al tratarse de Fiserv Connect, tus credenciales ni siquiera transitaron por tu perfil en Triple Impacto.</p>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col gap-3">
              <Link
                href="/donar"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-[#1A202C] text-white font-semibold rounded-xl hover:bg-black transition-colors"
              >
                Intentar Nuevamente <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-slate-50 text-slate-600 font-medium rounded-xl hover:bg-slate-100 transition-colors"
              >
                <Home className="w-4 h-4 text-slate-400" /> Volver al inicio
              </Link>
            </div>

            <div className="mt-6 flex flex-col items-center justify-center gap-1.5 text-xs text-slate-400">
              <Mail className="w-4 h-4 text-slate-400" />
              <p>Si la falla persiste, reportala a <a href="mailto:soporte@tripleimpacto.site" className="font-semibold text-slate-500 hover:text-slate-700">soporte@tripleimpacto.site</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PagoErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-rose-500 animate-spin mb-4" />
            <p className="text-slate-600 font-medium">Leyendo respuesta técnica...</p>
          </div>
        </div>
      }
    >
      <PagoErrorContent />
    </Suspense>
  );
}
