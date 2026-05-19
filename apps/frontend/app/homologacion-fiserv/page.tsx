'use client';

import React, { useState } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, PlayCircle, Loader2 } from 'lucide-react';

export default function HomologacionFiservPage() {
  const [loading, setLoading] = useState<false | 'mastercard' | 'visa'>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryMonth: '',
    expiryYear: '',
    securityCode: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Formatear número de tarjeta (quitar espacios para guardar)
    if (name === 'cardNumber') {
      const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      const parts = v.match(/.{1,4}/g);
      setFormData(prev => ({ ...prev, [name]: parts ? parts.join(' ') : v }));
      return;
    }

    if (name === 'expiryMonth' || name === 'expiryYear' || name === 'securityCode') {
      setFormData(prev => ({ ...prev, [name]: value.replace(/[^0-9]/g, '') }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRunMatrix = async (cardType: 'mastercard' | 'visa') => {
    // Validar mínimos
    const rawCardNumber = formData.cardNumber.replace(/\s+/g, '');
    if (!rawCardNumber || !formData.expiryMonth || !formData.expiryYear || !formData.securityCode) {
      setError('Por favor, completa todos los datos de la tarjeta.');
      return;
    }

    setLoading(cardType);
    setError(null);
    setResult(null);

    try {
      const payload = {
        cardNumber: rawCardNumber,
        expiryMonth: formData.expiryMonth,
        expiryYear: formData.expiryYear,
        securityCode: formData.securityCode,
        cardholderName: formData.cardholderName || 'Fiserv Test',
        cardType,
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/test/fiserv-rest/homologation/run-matrix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => null);
      
      if (!response.ok || !data || !data.success) {
        if (!data) {
           throw new Error(`Fallo de red o del servidor. Código HTTP: ${response.status}`);
        }
        const errorMsg = data.error 
          ? (typeof data.error === 'string' ? data.error : JSON.stringify(data.error)) 
          : data.message || 'Error en la respuesta del backend';
        throw new Error(`Detalle del error: ${errorMsg}`);
      }

      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(`[ERROR] ${err.message || 'Error de conexión (posible CORS o caída de red)'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-slate-900 p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Homologación Producción Fiserv REST</h1>
          <p className="text-slate-400 text-sm">Esta consola ejecutará las matrices de prueba de forma automatizada sobre el ambiente de Producción y anulará/devolverá los fondos en 1 segundo.</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="font-medium text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Número de Tarjeta (Real)</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleChange}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Nombre en Tarjeta</label>
              <input
                type="text"
                name="cardholderName"
                value={formData.cardholderName}
                onChange={handleChange}
                placeholder="Ej. Juan Perez"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-medium"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Mes</label>
                <input
                  type="text"
                  name="expiryMonth"
                  value={formData.expiryMonth}
                  onChange={handleChange}
                  placeholder="MM"
                  maxLength={2}
                  className="w-full px-4 py-3.5 bg-slate-50 text-center border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Año</label>
                <input
                  type="text"
                  name="expiryYear"
                  value={formData.expiryYear}
                  onChange={handleChange}
                  placeholder="YY"
                  maxLength={2}
                  className="w-full px-4 py-3.5 bg-slate-50 text-center border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">CVV</label>
                <input
                  type="text"
                  name="securityCode"
                  value={formData.securityCode}
                  onChange={handleChange}
                  placeholder="123"
                  maxLength={4}
                  className="w-full px-4 py-3.5 bg-slate-50 text-center border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-medium"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleRunMatrix('mastercard')}
              disabled={!!loading}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-600/20"
            >
              {loading === 'mastercard' ? <Loader2 className="w-6 h-6 animate-spin" /> : <PlayCircle className="w-6 h-6" />}
              <span className="text-sm">Ejecutar Matriz Mastercard</span>
              <span className="text-xs font-normal text-orange-200">(Sale + DataOnly + Void)</span>
            </button>
            <button
              onClick={() => handleRunMatrix('visa')}
              disabled={!!loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
            >
               {loading === 'visa' ? <Loader2 className="w-6 h-6 animate-spin" /> : <PlayCircle className="w-6 h-6" />}
              <span className="text-sm">Ejecutar Matriz Visa</span>
              <span className="text-xs font-normal text-blue-200">(PreAuth + PostAuth + Return)</span>
            </button>
          </div>

          {result && (
            <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Matriz Ejecutada Exitosamente
              </h3>
              <div className="space-y-4">
                {result.results.map((r: any, idx: number) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-1">
                    <span className="text-sm font-bold text-slate-700">{r.step}</span>
                    <span className="text-xs text-slate-500">Status: {r.data.transactionStatus}</span>
                    {r.orderId && (
                      <div className="mt-2 bg-slate-100 px-3 py-2 rounded-lg flex justify-between items-center">
                        <span className="text-xs font-mono text-slate-600">Order ID:</span>
                        <span className="text-sm font-mono font-bold text-slate-900 select-all">{r.orderId}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
