'use client';

import React, { useState } from 'react';
import { CreditCard, Lock, User, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import Swal from 'sweetalert2';

interface PaymentFormRestProps {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  initialAmount?: number;
  organizacionId?: string;
}

export default function PaymentFormRest({ onSuccess, onError, initialAmount, organizacionId }: PaymentFormRestProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const rawCardNumber = formData.cardNumber.replace(/\s+/g, '');
    if (!rawCardNumber || !formData.expiryMonth || !formData.expiryYear || !formData.securityCode || !formData.cardholderName) {
      setErrorMessage('Por favor, completa todos los datos de la tarjeta.');
      setStatus('error');
      return;
    }

    if (!initialAmount) {
      setErrorMessage('Monto no definido. Vuelve al paso anterior.');
      setStatus('error');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('auth_token');

      const payload = {
        cardNumber: rawCardNumber,
        expiryMonth: formData.expiryMonth,
        expiryYear: formData.expiryYear,
        securityCode: formData.securityCode,
        cardholderName: formData.cardholderName,
        amount: initialAmount,
        currency: 'ARS',
        organizacion_id: organizacionId,
      };

      const response = await fetch(`${apiUrl}/payments/fiserv/rest-sale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success && result.result?.transactionStatus === 'APPROVED') {
        setStatus('success');
        if (onSuccess) onSuccess(result);
      } else {
        setStatus('error');
        const errStr = result.message || result.error || 'Error en el procesamiento del pago';
        setErrorMessage(typeof errStr === 'string' ? errStr : JSON.stringify(errStr));
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
      <div className="bg-white rounded-3xl p-8 text-center border border-emerald-100 max-w-2xl mx-auto shadow-sm">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Pago Aprobado!</h2>
        <p className="text-slate-500 mb-8">
          Tu donación ha sido procesada correctamente y ya estás dado de alta en Bonda para disfrutar de tus beneficios.
        </p>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="w-full py-4 bg-[#40a8ab] text-white rounded-2xl font-semibold hover:bg-teal-600 transition-all flex items-center justify-center gap-2"
        >
          Ir a mis beneficios <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl w-full mx-auto bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
      <div className="bg-slate-900 p-8 text-center flex flex-col items-center">
        <Lock className="w-8 h-8 text-white/80 mb-3" />
        <h2 className="text-2xl font-bold text-white mb-2">Pago Seguro</h2>
        <p className="text-slate-400 text-sm">
          Completa los datos de tu tarjeta para procesar tu donación de ${initialAmount}.
        </p>
      </div>

      <div className="p-8">
        {status === 'error' && (
          <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="font-medium text-sm">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Número de Tarjeta</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleChange}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-medium text-slate-800"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Titular de la Tarjeta</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  name="cardholderName"
                  value={formData.cardholderName}
                  onChange={handleChange}
                  placeholder="Como aparece en la tarjeta"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-medium text-slate-800"
                  required
                />
              </div>
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
                  className="w-full px-4 py-3.5 bg-slate-50 text-center border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-medium text-slate-800"
                  required
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
                  className="w-full px-4 py-3.5 bg-slate-50 text-center border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-medium text-slate-800"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">CVV</label>
                <input
                  type="password"
                  name="securityCode"
                  value={formData.securityCode}
                  onChange={handleChange}
                  placeholder="123"
                  maxLength={4}
                  className="w-full px-4 py-3.5 bg-slate-50 text-center border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-medium text-slate-800"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#40a8ab] hover:bg-teal-600 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-teal-600/20"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Lock className="w-5 h-5" />}
            <span>{loading ? 'Procesando...' : `Confirmar Donación de $${initialAmount}`}</span>
          </button>
        </form>

        <div className="mt-8 flex items-center justify-center gap-6 opacity-40 grayscale">
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
        </div>
      </div>
    </div>
  );
}
