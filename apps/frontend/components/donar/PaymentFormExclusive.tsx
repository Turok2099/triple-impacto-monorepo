'use client';

import React, { useState } from 'react';
import { CreditCard, Lock, User, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { formatearMonto, validarMonto, type Organizacion } from "@/lib/payments";

interface PaymentFormExclusiveProps {
  organizacion: Organizacion;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

const MONTOS_SUGERIDOS = [5000, 10000, 15000];
const MONTO_MAXIMO = 20000;

export default function PaymentFormExclusive({ organizacion, onSuccess, onError }: PaymentFormExclusiveProps) {
  const [montoSeleccionado, setMontoSeleccionado] = useState<number | null>(5000);
  const [montoCustom, setMontoCustom] = useState("");
  const [usarMontoCustom, setUsarMontoCustom] = useState(false);

  // Estados del pago
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

  const montoMinimoActual = organizacion.monto_minimo || 500;
  const montosSugeridosActuales = MONTOS_SUGERIDOS;

  const handleMontoSugeridoClick = (monto: number) => {
    if (monto < montoMinimoActual) {
      setErrorMessage(`El monto mínimo para donar es ${formatearMonto(montoMinimoActual)}`);
      return;
    }
    setMontoSeleccionado(monto);
    setUsarMontoCustom(false);
    setMontoCustom("");
    setErrorMessage('');
  };

  const handleMontoCustomChange = (value: string) => {
    setMontoCustom(value);
    setUsarMontoCustom(true);
    setMontoSeleccionado(null);

    const monto = parseFloat(value);
    if (!isNaN(monto) && monto > 0) {
      if (monto < montoMinimoActual) {
        setErrorMessage(`El monto mínimo para donar es ${formatearMonto(montoMinimoActual)}`);
      } else if (monto > MONTO_MAXIMO) {
        setErrorMessage(`El monto máximo permitido es ${formatearMonto(MONTO_MAXIMO)}`);
      } else {
        setErrorMessage('');
      }
    } else {
      setErrorMessage('');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'cardNumber') {
      const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      const parts = v.match(/.{1,4}/g);
      setFormData(prev => ({ ...prev, [name]: parts ? parts.join(' ') : v }));
      return;
    }

    if (name === 'expiryMonth' || name === 'expiryYear' || name === 'securityCode') {
      let clean = value.replace(/[^0-9]/g, '');
      if (name === 'expiryMonth') clean = clean.slice(0, 2);
      if (name === 'expiryYear') clean = clean.slice(0, 4);
      if (name === 'securityCode') clean = clean.slice(0, 4);
      
      setFormData(prev => ({ ...prev, [name]: clean }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar monto
    const montoFinal = usarMontoCustom ? parseFloat(montoCustom) : montoSeleccionado || 0;
    
    if (montoFinal < montoMinimoActual) {
      setErrorMessage(`El monto mínimo para donar es ${formatearMonto(montoMinimoActual)}`);
      setStatus('error');
      return;
    }
    if (montoFinal > MONTO_MAXIMO) {
      setErrorMessage(`El monto máximo permitido por transacción es ${formatearMonto(MONTO_MAXIMO)}`);
      setStatus('error');
      return;
    }
    const errorMontoOrg = validarMonto(montoFinal, montoMinimoActual);
    if (errorMontoOrg) {
      setErrorMessage(errorMontoOrg);
      setStatus('error');
      return;
    }

    // Validar Tarjeta
    const rawCardNumber = formData.cardNumber.replace(/\s+/g, '');
    if (!rawCardNumber || !formData.expiryMonth || !formData.expiryYear || !formData.securityCode || !formData.cardholderName) {
      setErrorMessage('Por favor, completa todos los datos de la tarjeta.');
      setStatus('error');
      return;
    }

    // Formatear datos de la tarjeta para cumplir estrictamente con Fiserv
    const formattedMonth = formData.expiryMonth.padStart(2, '0');
    const formattedYear = formData.expiryYear.length === 4 ? formData.expiryYear.slice(-2) : formData.expiryYear.padStart(2, '0');

    if (formData.securityCode.length < 3 || formData.securityCode.length > 4) {
      setErrorMessage('El código de seguridad (CVV) debe tener 3 o 4 dígitos.');
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
        expiryMonth: formattedMonth,
        expiryYear: formattedYear,
        securityCode: formData.securityCode,
        cardholderName: formData.cardholderName,
        amount: montoFinal,
        currency: 'ARS',
        organizacion_id: organizacion.id,
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

  const montoActualVisual = usarMontoCustom ? parseFloat(montoCustom) || 0 : montoSeleccionado || 0;

  if (status === 'success') {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border border-emerald-100 max-w-2xl mx-auto shadow-sm animate-in fade-in zoom-in duration-350">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Donación Aprobada!</h2>
        <p className="text-slate-500 mb-8">
          Tu donación a <span className="font-semibold text-slate-800">{organizacion.nombre}</span> ha sido procesada correctamente. Ya estás dado de alta en Bonda para disfrutar de tus beneficios.
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
    <div className="max-w-2xl w-full mx-auto bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-md">
      <div className="bg-[#40a8ab] p-6 text-center text-white">
        <h3 className="text-lg font-bold tracking-wide uppercase">
          CLUB {organizacion.nombre} ¡¡DONAR TIENE PREMIO!!
        </h3>
      </div>

      <div className="p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-slate-800 mb-2">
            {organizacion.nombre} - CLUB TRIPLE IMPACTO
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            {organizacion.nombre === "PLATO LLENO" ? (
              "¡Sumate a Club Plato Lleno y sé parte del Triple Impacto! Con tu aporte mensual, nos ayudás a seguir rescatando comida que de otro modo se perdería, y distribuirla entre quienes más lo necesitan. Como agradecimiento por tu compromiso, accedés a la Red de Beneficios del Club Triple Impacto, donde vas a encontrar descuentos exclusivos en tus marcas favoritas."
            ) : (
              organizacion.descripcion || `¡Sumate y sé parte del Triple Impacto! Con tu aporte mensual, nos ayudás a sostener proyectos de impacto y como agradecimiento accedés a nuestra red de beneficios y descuentos exclusivos.`
            )}
          </p>
        </div>

        {(status === 'error' || errorMessage) && (
          <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="font-medium text-sm">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* SECCIÓN 1: MONTO */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700 ml-1">
              1. ¿Cuánto querés donar? *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {montosSugeridosActuales.map((monto) => (
                <button
                  key={monto}
                  type="button"
                  onClick={() => handleMontoSugeridoClick(monto)}
                  className={`py-3 px-4 rounded-2xl font-semibold text-center transition-all cursor-pointer ${montoSeleccionado === monto && !usarMontoCustom
                    ? "bg-[#40a8ab] text-white shadow-md"
                    : "bg-slate-50 text-slate-700 border-2 border-slate-200 hover:border-slate-300"
                    }`}
                >
                  {formatearMonto(monto)}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setUsarMontoCustom(true);
                  setMontoSeleccionado(null);
                }}
                className={`py-3 px-4 rounded-2xl font-bold text-center transition-all cursor-pointer ${usarMontoCustom
                  ? "bg-[#40a8ab] text-white shadow-md"
                  : "bg-slate-50 text-slate-700 border-2 border-slate-200 hover:border-slate-300"
                  }`}
              >
                Otro
              </button>
            </div>

            {usarMontoCustom && (
              <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                  <input
                    type="number"
                    min={montoMinimoActual}
                    max={MONTO_MAXIMO}
                    step="1"
                    value={montoCustom}
                    onChange={(e) => handleMontoCustomChange(e.target.value)}
                    placeholder={montoMinimoActual.toString()}
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#40a8ab] focus:border-[#40a8ab] outline-none font-bold text-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* SECCIÓN 2: TARJETA */}
          <div className="space-y-6">
            <label className="block text-sm font-semibold text-slate-700 ml-1">
              2. Datos de tu tarjeta
            </label>
            <div className="space-y-4">
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleChange}
                  placeholder="Número de Tarjeta"
                  maxLength={19}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#40a8ab] outline-none font-medium text-slate-800"
                  required
                />
              </div>

              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  name="cardholderName"
                  value={formData.cardholderName}
                  onChange={handleChange}
                  placeholder="Titular de la Tarjeta"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#40a8ab] outline-none font-medium text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  inputMode="numeric"
                  name="expiryMonth"
                  value={formData.expiryMonth}
                  onChange={handleChange}
                  onBlur={() => setFormData(prev => ({ ...prev, expiryMonth: prev.expiryMonth ? prev.expiryMonth.padStart(2, '0') : '' }))}
                  placeholder="Mes (MM)"
                  className="w-full px-4 py-3.5 bg-slate-50 text-center border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#40a8ab] outline-none font-medium text-slate-800"
                  required
                />
                <input
                  type="text"
                  inputMode="numeric"
                  name="expiryYear"
                  value={formData.expiryYear}
                  onChange={handleChange}
                  onBlur={() => setFormData(prev => ({ ...prev, expiryYear: prev.expiryYear.length === 4 ? prev.expiryYear.slice(-2) : prev.expiryYear.padStart(2, '0') }))}
                  placeholder="Año (YY)"
                  className="w-full px-4 py-3.5 bg-slate-50 text-center border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#40a8ab] outline-none font-medium text-slate-800"
                  required
                />
                <input
                  type="text"
                  inputMode="numeric"
                  name="securityCode"
                  value={formData.securityCode}
                  onChange={handleChange}
                  placeholder="CVV"
                  className="w-full px-4 py-3.5 bg-slate-50 text-center border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#40a8ab] outline-none font-medium text-slate-800"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#40a8ab] hover:bg-teal-600 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-teal-600/20"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Lock className="w-5 h-5" />}
            <span>{loading ? 'Procesando...' : `Donar ${formatearMonto(montoActualVisual)} de forma segura`}</span>
          </button>
        </form>

        <div className="mt-8 flex items-center justify-center gap-6">
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-5 object-contain" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-7 object-contain" />
        </div>
      </div>
    </div>
  );
}

