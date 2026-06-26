'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Lock, User, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { obtenerOrganizaciones, formatearMonto, validarMonto, type Organizacion } from "@/lib/payments";

interface PaymentFormRestProps {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

const MONTO_MAXIMO = 100000;

export default function PaymentFormRest({ onSuccess, onError }: PaymentFormRestProps) {
  // Estados para Organizaciones y Monto
  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [errorOrgs, setErrorOrgs] = useState<string | null>(null);
  const [organizacionId, setOrganizacionId] = useState<string>("");
  
  const [montoSeleccionado, setMontoSeleccionado] = useState<number | null>(5000);
  const [montoCustom, setMontoCustom] = useState("");
  const [usarMontoCustom, setUsarMontoCustom] = useState(false);
  const [isRecurring, setIsRecurring] = useState(true);

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

  const organizacionSeleccionada = organizaciones.find(org => org.id === organizacionId);
  const montoMinimoActual = organizacionSeleccionada?.monto_minimo || 5000;
  const montosSugeridosActuales = [
    organizacionSeleccionada?.monto_fijo_1 || 10000,
    organizacionSeleccionada?.monto_fijo_2 || 20000,
    organizacionSeleccionada?.monto_fijo_3 || 30000
  ];

  useEffect(() => {
    cargarOrganizaciones();
  }, []);

  useEffect(() => {
    if (organizacionSeleccionada) {
      const min = organizacionSeleccionada.monto_minimo || 5000;
      setMontoSeleccionado(min);
      if (!usarMontoCustom) {
        setErrorMessage('');
      }
    }
  }, [organizacionId, organizaciones]);

  const cargarOrganizaciones = async () => {
    try {
      setLoadingOrgs(true);
      setErrorOrgs(null);
      const orgs = await obtenerOrganizaciones(true);
      setOrganizaciones(orgs);
      if (orgs.length > 0) {
        setOrganizacionId(orgs[0].id);
      }
    } catch (err: any) {
      setErrorOrgs(err.message || "Error al cargar organizaciones");
    } finally {
      setLoadingOrgs(false);
    }
  };

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
    
    // Validar ONG
    if (!organizacionId) {
      setErrorMessage('Por favor selecciona una organización.');
      setStatus('error');
      return;
    }

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
        organizacion_id: organizacionId,
        isRecurring: isRecurring,
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
      <div className="bg-white rounded-3xl p-8 text-center border border-emerald-100 max-w-2xl mx-auto shadow-sm">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Pago Aprobado!</h2>
        <p className="text-slate-500 mb-8">
          Tu donación ha sido procesada correctamente. ¡Muchas gracias por tu compromiso!
        </p>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="w-full py-4 bg-[#2c8184] text-white rounded-2xl font-semibold hover:bg-teal-600 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          Ir al Dashboard de AYNI <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl w-full mx-auto bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
      <div className="bg-[#2c8184] p-8 text-center flex flex-col items-center">
        <Lock className="w-8 h-8 text-white/90 mb-3" />
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Pago Seguro</h2>
        <p className="text-teal-50 text-sm md:text-base">
          Completa los datos de tu donación y tu tarjeta.
        </p>
      </div>

      <div className="p-8">
        {(status === 'error' || errorMessage) && (
          <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="font-semibold text-sm md:text-base">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECCIÓN 1: ONG */}
          <div className="space-y-3">
            <label className="block text-sm md:text-base font-bold text-slate-700 ml-1">
              1. ¿A qué organización querés donar? *
            </label>
            {loadingOrgs ? (
              <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-[#2c8184]" /></div>
            ) : errorOrgs ? (
              <div className="text-red-500 text-sm md:text-base">{errorOrgs}</div>
            ) : (
              <select
                value={organizacionId}
                onChange={(e) => setOrganizacionId(e.target.value)}
                className="w-full px-4 py-3 text-sm md:text-base border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-800 bg-slate-50 font-semibold cursor-pointer"
                required
              >
                <option value="" disabled>Seleccioná una organización</option>
                {organizaciones.map((org) => (
                  <option key={org.id} value={org.id}>{org.nombre}</option>
                ))}
              </select>
            )}
          </div>

          {/* SECCIÓN 2: FRECUENCIA */}
          <div className="space-y-3">
            <label className="block text-sm md:text-base font-bold text-slate-700 ml-1">
              2. Frecuencia de donación
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsRecurring(true)}
                className={`py-3 px-4 rounded-2xl text-sm md:text-base font-bold text-center transition-all cursor-pointer ${isRecurring
                  ? "bg-[#2c8184] text-white shadow-md"
                  : "bg-slate-50 text-slate-700 border-2 border-slate-200 hover:border-slate-300"
                  }`}
              >
                Mensual
              </button>
              <button
                type="button"
                onClick={() => setIsRecurring(false)}
                className={`py-3 px-4 rounded-2xl text-sm md:text-base font-bold text-center transition-all cursor-pointer ${!isRecurring
                  ? "bg-[#2c8184] text-white shadow-md"
                  : "bg-slate-50 text-slate-700 border-2 border-slate-200 hover:border-slate-300"
                  }`}
              >
                Única vez
              </button>
            </div>

          </div>

          {/* SECCIÓN 3: MONTO */}
          <div className="space-y-3">
            <label className="block text-sm md:text-base font-bold text-slate-700 ml-1">
              3. ¿Cuánto querés donar? *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {montosSugeridosActuales.map((monto) => (
                <button
                  key={monto}
                  type="button"
                  onClick={() => handleMontoSugeridoClick(monto)}
                  className={`py-3 px-4 rounded-2xl text-sm md:text-base font-bold text-center transition-all cursor-pointer ${montoSeleccionado === monto && !usarMontoCustom
                    ? "bg-slate-900 text-white shadow-md"
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
                className={`py-3 px-4 rounded-2xl text-sm md:text-base font-bold text-center transition-all cursor-pointer ${usarMontoCustom
                  ? "bg-slate-900 text-white shadow-md"
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
                    className="w-full pl-10 pr-4 py-3.5 text-sm md:text-base bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none font-bold text-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* SECCIÓN 4: TARJETA */}
          <div className="space-y-6">
            <label className="block text-sm md:text-base font-bold text-slate-700 ml-1">
              4. Datos de tu tarjeta
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
                  className="w-full pl-12 pr-4 py-3.5 text-sm md:text-base bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-medium text-slate-800"
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
                  className="w-full pl-12 pr-4 py-3.5 text-sm md:text-base bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-medium text-slate-800"
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
                  className="w-full px-4 py-3.5 text-sm md:text-base bg-slate-50 text-center border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-medium text-slate-800"
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
                  className="w-full px-4 py-3.5 text-sm md:text-base bg-slate-50 text-center border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-medium text-slate-800"
                  required
                />
                <input
                  type="text"
                  inputMode="numeric"
                  name="securityCode"
                  value={formData.securityCode}
                  onChange={handleChange}
                  placeholder="CVV"
                  className="w-full px-4 py-3.5 text-sm md:text-base bg-slate-50 text-center border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-medium text-slate-800"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || loadingOrgs || !organizacionId}
            className="w-full bg-[#2c8184] hover:bg-teal-600 disabled:opacity-50 text-white text-sm md:text-base font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-teal-600/20 cursor-pointer"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Lock className="w-5 h-5" />}
            <span>{loading ? 'Procesando...' : `Donar ${formatearMonto(montoActualVisual)} de forma segura`}</span>
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center justify-center gap-4">
          <div className="flex items-center justify-center gap-6">
            <img src="https://res.cloudinary.com/dxbtafe9u/image/upload/v1781652329/VISA-logo-500x281_k7clll.png" alt="Visa" className="h-6 object-contain" />
            <img src="https://res.cloudinary.com/dxbtafe9u/image/upload/v1781652329/Mastercard-logo_pwgxxu.png" alt="Mastercard" className="h-8 object-contain" />
          </div>
          <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-slate-500 font-medium bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
            <Lock className="w-3.5 h-3.5" />
            <span>Pagos procesados de forma segura por</span>
            <img src="https://res.cloudinary.com/dxbtafe9u/image/upload/v1781652396/Fiserv_logo.svg_veglfg.png" alt="Fiserv" className="h-3.5 object-contain ml-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
