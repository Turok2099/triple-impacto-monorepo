'use client';

import React, { useState } from 'react';
import { CreditCard, Calendar, Lock, User, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface PaymentFormRestProps {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export default function PaymentFormRest({ onSuccess, onError }: PaymentFormRestProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    storeId: '5926012006',
    cardNumber: '',
    cardholderName: '',
    expiryMonth: '',
    expiryYear: '',
    securityCode: '',
    amount: '100.00',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Formatear número de tarjeta
    if (name === 'cardNumber') {
      const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      const matches = v.match(/\d{4,16}/g);
      const match = matches && matches[0] || '';
      const parts: string[] = [];
      for (let i = 0, len = match.length; i < len; i += 4) {
        parts.push(match.substring(i, i + 4));
      }
      if (parts.length) {
        setFormData(prev => ({ ...prev, [name]: parts.join(' ') }));
      } else {
        setFormData(prev => ({ ...prev, [name]: v }));
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${apiUrl}/test/fiserv-rest/pay-first`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          ...formData,
          cardNumber: formData.cardNumber.replace(/\s/g, ''),
          amount: parseFloat(formData.amount),
        }),
      });

      const result = await response.json();

      if (result.transactionStatus === 'APPROVED') {
        setStatus('success');
        if (onSuccess) onSuccess(result);
      } else {
        setStatus('error');
        setErrorMessage(result.processor?.responseMessage || result.error?.message || 'Error en el procesamiento del pago');
        if (onError) onError(result);
      }
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-emerald-100 max-w-md mx-auto">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Pago Aprobado!</h2>
        <p className="text-slate-500 mb-8">
          Tu suscripción ha sido activada correctamente mediante Fiserv REST API. El token ha sido archivado de forma segura.
        </p>
        <button 
          onClick={() => setStatus('idle')}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
        >
          Realizar otra prueba <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-auto border border-slate-100">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
          <Lock className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Checkout Seguro</h2>
          <p className="text-sm text-slate-500">Pruebas Fiserv REST API</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Store ID */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 ml-1">Tienda a Probar (Store ID)</label>
          <div className="relative">
            <select
              name="storeId"
              value={formData.storeId}
              onChange={handleChange}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-slate-800 font-medium appearance-none"
              required
            >
              <option value="5926012005">5926012005 - Tienda 05 (Mastercard/Void)</option>
              <option value="5926012006">5926012006 - Tienda 06 (Visa/Return)</option>
            </select>
          </div>
        </div>

        {/* Monto de Prueba */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 ml-1">Monto de Donación (ARS)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full pl-8 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-slate-800 font-medium"
              required
            />
          </div>
        </div>

        {/* Nombre del Titular */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 ml-1">Titular de la Tarjeta</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              name="cardholderName"
              placeholder="Como aparece en la tarjeta"
              value={formData.cardholderName}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-slate-800"
              required
            />
          </div>
        </div>

        {/* Número de Tarjeta */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 ml-1">Número de Tarjeta</label>
          <div className="relative">
            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              name="cardNumber"
              placeholder="0000 0000 0000 0000"
              maxLength={19}
              value={formData.cardNumber}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-slate-800 font-mono"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Vencimiento */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 ml-1">Vencimiento</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="expiryMonth"
                placeholder="MM"
                maxLength={2}
                value={formData.expiryMonth}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-center text-slate-800"
                required
              />
              <input
                type="text"
                name="expiryYear"
                placeholder="AA"
                maxLength={2}
                value={formData.expiryYear}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-center text-slate-800"
                required
              />
            </div>
          </div>

          {/* CVV */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 ml-1">CVV</label>
            <div className="relative">
              <input
                type="password"
                name="securityCode"
                placeholder="123"
                maxLength={4}
                value={formData.securityCode}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-center text-slate-800"
                required
              />
            </div>
          </div>
        </div>

        {status === 'error' && (
          <div className="flex gap-2 p-4 bg-red-50 text-red-600 rounded-2xl text-sm items-start">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Procesando...
            </>
          ) : (
            'Pagar y Activar Suscripción'
          )}
        </button>
      </form>

      <div className="mt-8 flex items-center justify-center gap-6 opacity-40 grayscale">
        <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="Fiserv" className="h-4" />
      </div>
    </div>
  );
}
