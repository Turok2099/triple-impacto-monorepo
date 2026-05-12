'use client';

import React, { useState } from 'react';
import PaymentFormRest from '@/components/donar/PaymentFormRest';
import { Terminal, ShieldCheck, Zap } from 'lucide-react';

export default function TestPagosRestPage() {
  const [txId, setTxId] = useState('');
  const [amountToReturn, setAmountToReturn] = useState('100.00');
  const [lastResponse, setLastResponse] = useState<any>(null);

  const handleToolAction = async (action: 'void' | 'return', storeId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('auth_token');
      
      const res = await fetch(`${apiUrl}/test/fiserv-rest/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ 
          ipgTransactionId: txId, 
          storeId,
          ...(action === 'return' ? { amount: parseFloat(amountToReturn) } : {})
        })
      });

      const data = await res.json();
      setLastResponse(data);
    } catch (error: any) {
      console.error(`Error in ${action}:`, error);
      setLastResponse({ success: false, error: error.message });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
        
        {/* Lado Izquierdo: Info y Formulario */}
        <div className="space-y-8">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-4">
              <Zap className="w-3 h-3" /> Entorno de Pruebas
            </span>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Integración <span className="text-indigo-600">Fiserv REST</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Utilizá este formulario para validar el flujo de <strong>Pagos Recurrentes</strong>. 
              Los datos se enviarán al entorno de certificación de Fiserv y el token se archivará de forma segura.
            </p>
          </div>

          <PaymentFormRest 
            onSuccess={(data) => setLastResponse(data)}
            onError={(err) => setLastResponse(err)}
          />

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4">
            <ShieldCheck className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-amber-900 mb-1">Nota de Seguridad</h3>
              <p className="text-sm text-amber-800 leading-relaxed">
                Esta página es exclusivamente para pruebas técnicas. No utilices tarjetas de crédito reales. 
                Utilizá los números de prueba provistos en el manual de Fiserv.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-8 border border-slate-200">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Herramientas de Homologación</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Transaction/Order ID</label>
                  <input 
                    type="text" 
                    value={txId}
                    onChange={(e) => setTxId(e.target.value)}
                    placeholder="Ej: ORD-977aad86"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Monto a Devolver</label>
                  <input 
                    type="number" 
                    value={amountToReturn}
                    onChange={(e) => setAmountToReturn(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => handleToolAction('void', '5926012005')}
                  className="flex-1 py-3 bg-red-50 text-red-700 font-bold rounded-xl hover:bg-red-100 transition-colors border border-red-200"
                >
                  Void (Tienda 05)
                </button>
                <button 
                  onClick={() => handleToolAction('return', '5926012006')}
                  className="flex-1 py-3 bg-orange-50 text-orange-700 font-bold rounded-xl hover:bg-orange-100 transition-colors border border-orange-200"
                >
                  Return (Tienda 06)
                </button>
              </div>
              <p className="text-xs text-slate-500 text-center mt-2">
                * El sistema usará automáticamente la ruta /orders o /payments según el ID.
              </p>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Inspector de Respuesta */}
        <div className="sticky top-12">
          <div className="bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-800">
            <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                  Fiserv Response Inspector
                </span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
              </div>
            </div>
            <div className="p-6 font-mono text-sm overflow-auto max-h-[70vh]">
              {lastResponse ? (
                <pre className="text-indigo-300">
                  {JSON.stringify(lastResponse, null, 2)}
                </pre>
              ) : (
                <div className="text-slate-500 italic py-12 text-center">
                  Aguardando transacción... <br/>
                  Los resultados de la API aparecerán aquí.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
             <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Endpoint</p>
                <p className="text-xs font-mono text-slate-700 break-all">/gateway/v2/payments</p>
             </div>
             <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Auth Type</p>
                <p className="text-xs font-mono text-slate-700">HMAC-SHA256</p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
