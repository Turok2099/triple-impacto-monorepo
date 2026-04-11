'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle2, Gift, Mail, ArrowRight, Loader2 } from 'lucide-react';

function PagoExitosoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [verificando, setVerificando] = useState(true);

  const approval_code = searchParams.get('approval_code');
  const oid = searchParams.get('oid');
  const chargetotal = searchParams.get('chargetotal');

  useEffect(() => {
    if (!approval_code || !oid) {
      router.push('/donar/error');
      return;
    }
    const timer = setTimeout(() => {
      setVerificando(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [approval_code, oid, router]);

  if (verificando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center max-w-sm text-center">
          <Loader2 className="w-12 h-12 text-[#40a8ab] animate-spin mb-6" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Verificando tu donación...
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Por favor, espera un momento mientras procesamos la confirmación segura con Fiserv.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="max-w-xl w-full">
        {/* Main Success Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="bg-[#40a8ab] p-8 text-center text-white flex flex-col items-center">
            <CheckCircle2 className="w-16 h-16 mb-4 text-white" strokeWidth={1.5} />
            <h1 className="text-2xl font-bold mb-1">¡Donación Exitosa!</h1>
            <p className="text-green-100 text-sm font-medium">
              Tu aporte ha sido procesado de forma segura
            </p>
          </div>

          {/* Contenido */}
          <div className="p-8">
            {/* Información de la transacción */}
            {/* Monto Aportado (Central) */}
            {chargetotal && (
              <div className="mb-8 text-center bg-slate-50 border border-slate-100 rounded-2xl p-6">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Monto acreditado
                </p>
                <div className="flex items-center justify-center text-4xl sm:text-5xl font-black text-[#40a8ab] tracking-tight">
                  <span className="text-2xl sm:text-3xl mr-1 opacity-80">$</span>
                  {parseFloat(chargetotal).toLocaleString('es-AR')}
                  <span className="text-xl sm:text-2xl text-slate-400 font-bold ml-2">ARS</span>
                </div>
              </div>
            )}

            {/* Beneficios activados */}
            <div className="bg-[#40a8ab]/5 border border-[#40a8ab]/10 rounded-xl p-5 mb-8">
              <h2 className="font-bold text-[#40a8ab] mb-3 flex items-center gap-2">
                <Gift className="w-5 h-5" /> Beneficios activados
              </h2>
              <div className="text-sm text-slate-700 space-y-2 font-medium">
                <p>• Tu cuenta de Beneficios Bonda fue enlazada exitosamente</p>
                <p>• Acceso full a catálogos en primeras marcas nacionales</p>
              </div>
            </div>

            {/* Botones de acción directos */}
            <div className="flex flex-col gap-3">
              <Link
                href="/dashboard"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-[#40a8ab] text-white font-semibold rounded-xl hover:bg-[#128a4a] transition-colors"
              >
                Ir a mi Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/"
                className="w-full flex items-center justify-center py-3.5 px-6 bg-slate-50 text-slate-600 font-medium rounded-xl hover:bg-slate-100 transition-colors"
              >
                Volver al inicio
              </Link>
            </div>

            <div className="mt-6 flex flex-col items-center justify-center gap-1.5 text-xs text-slate-400">
              <Mail className="w-4 h-4 text-slate-400" />
              <p>Copia del recibo enviada a <span className="font-semibold text-slate-500">{user?.email}</span></p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function PagoExitosoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-[#40a8ab] animate-spin mb-4" />
            <p className="text-slate-600 font-medium">Validando operación...</p>
          </div>
        </div>
      }
    >
      <PagoExitosoContent />
    </Suspense>
  );
}
