'use client';

import Link from 'next/link';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { actualizarPerfil, cambiarContrasena } from '@/lib/dashboard';
import {
  CheckCircle,
  ChevronRight,
  CreditCard,
  PlusCircle,
  Camera,
  Eye,
  EyeOff,
  Lock,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Shield,
  Ticket,
  Heart,
} from 'lucide-react';
import { getOrganizationLogoUrl } from '@/lib/organization-logos';
import { DashboardUsuario } from '@/lib/dashboard';

const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
  'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
  'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán',
];

interface SeccionPerfilProps {
  isActive?: boolean;
  role?: string;
  dashboard?: DashboardUsuario | null;
}

export default function SeccionPerfil({ isActive = false, role = 'user', dashboard }: SeccionPerfilProps) {
  const { user, logout } = useAuth();

  // Toast flotante
  const [toast, setToast] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const mostrarToast = (tipo: 'ok' | 'error', texto: string) => {
    setToast({ tipo, texto });
    setTimeout(() => setToast(null), 3500);
  };

  const [fundacionLogoError, setFundacionLogoError] = useState<Record<string, boolean>>({});

  // Datos de perfil
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [provincia, setProvincia] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Cambio de contraseña
  const [mostrarCambioPass, setMostrarCambioPass] = useState(false);
  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [passConfirmar, setPassConfirmar] = useState('');
  const [verPassActual, setVerPassActual] = useState(false);
  const [verPassNueva, setVerPassNueva] = useState(false);
  const [verPassConfirmar, setVerPassConfirmar] = useState(false);
  const [cambiandoPass, setCambiandoPass] = useState(false);

  useEffect(() => {
    if (!user) return;
    setNombre(user.nombre || '');
    setEmail(user.email || '');
    setTelefono(user.telefono || '');
    setProvincia(user.provincia || '');
    setLocalidad(user.localidad || '');
  }, [user]);

  const handleGuardarPerfil = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    setGuardando(true);
    try {
      await actualizarPerfil({ nombre, email, telefono, provincia, localidad }, token);
      mostrarToast('ok', 'Perfil actualizado correctamente');
    } catch (error: any) {
      mostrarToast('error', error.message || 'Error al guardar cambios');
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarContrasena = async () => {

    if (!passActual || !passNueva || !passConfirmar) {
      mostrarToast('error', 'Completá todos los campos');
      return;
    }
    if (passNueva !== passConfirmar) {
      mostrarToast('error', 'Las contraseñas nuevas no coinciden');
      return;
    }
    if (passNueva.length < 8) {
      mostrarToast('error', 'La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    setCambiandoPass(true);
    try {
      await cambiarContrasena(passActual, passNueva, token);
      mostrarToast('ok', 'Contraseña actualizada correctamente');
      setPassActual('');
      setPassNueva('');
      setPassConfirmar('');
      setMostrarCambioPass(false);
    } catch (error: any) {
      mostrarToast('error', error.message || 'Error al cambiar contraseña');
    } finally {
      setCambiandoPass(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto pb-12">

      {/* Toast flotante */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold transition-all animate-in fade-in slide-in-from-bottom-4 ${
          toast.tipo === 'ok'
            ? 'bg-[#40a8ab] text-white'
            : 'bg-red-500 text-white'
        }`}>
          {toast.tipo === 'ok'
            ? <CheckCircle2 className="w-5 h-5 shrink-0" />
            : <XCircle className="w-5 h-5 shrink-0" />
          }
          {toast.texto}
        </div>
      )}

      {/* Impact Summary */}
      {dashboard && (
        <section className="px-6 pt-8">
          <h2 className="text-[#1A202C] font-bold text-xl mb-4">
            Resumen de Impacto
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-slate-50 flex flex-col items-center gap-2 text-center">
              <Ticket className="w-8 h-8 text-[#40a8ab]" strokeWidth={1.5} />
              <p className="text-[10px] font-semibold text-[#718096] uppercase tracking-tight">
                Cupones Activos
              </p>
              <p className="text-2xl font-bold text-[#40a8ab]">
                {dashboard.estadisticas?.cuponesActivos || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-slate-50 flex flex-col items-center gap-2 text-center">
              <CheckCircle2
                className="w-8 h-8 text-[#40a8ab]"
                strokeWidth={1.5}
              />
              <p className="text-[10px] font-semibold text-[#718096] uppercase tracking-tight">
                Cupones Usados
              </p>
              <p className="text-2xl font-bold text-[#40a8ab]">
                {dashboard.estadisticas?.cuponesUsados || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-slate-50 flex flex-col items-center gap-2 text-center">
              <Heart className="w-8 h-8 text-[#40a8ab]" strokeWidth={1.5} />
              <p className="text-[10px] font-semibold text-[#718096] uppercase tracking-tight">
                Total Donado
              </p>
              <p className="text-2xl font-bold text-[#40a8ab]">
                ${dashboard.estadisticas?.totalDonado?.toLocaleString("es-AR") || "0"}
              </p>
            </div>
          </div>
          <p className="mt-4 text-[12px] text-slate-400 font-medium">
            Último cupón solicitado:{" "}
            <span className="text-slate-600">
              {dashboard.estadisticas?.ultimoCuponSolicitado
                ? new Date(dashboard.estadisticas.ultimoCuponSolicitado).toLocaleDateString("es-AR", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
                : "Nunca"}
            </span>
          </p>
        </section>
      )}

      {/* My Foundations */}
      {dashboard && (
        <section className="px-6 py-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-[#1A202C]">
              Mis Fundaciones
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {dashboard.fundaciones && dashboard.fundaciones.length > 0 ? (
              dashboard.fundaciones.map((fundacion) => {
                const logoUrl = getOrganizationLogoUrl(fundacion.nombre, fundacion.slug);
                const useLogo = !!logoUrl && !fundacionLogoError[fundacion.id];
                const initialsBg = `url(https://ui-avatars.com/api/?name=${encodeURIComponent(fundacion.nombre)}&background=16a459&color=fff&size=128)`;
                const totalDonado = fundacion.totalDonado ?? 0;
                const totalFormateado = totalDonado.toLocaleString("es-AR");
                const isInactive = fundacion.isActive === false;
                
                return (
                  <div
                    key={fundacion.id}
                    className={`group overflow-hidden rounded-3xl transition-all duration-300 flex flex-col relative ${
                      isInactive 
                        ? 'bg-slate-50 border border-slate-200 grayscale opacity-75' 
                        : 'bg-white border border-[#40a8ab]/20 shadow-md hover:shadow-lg transition-all'
                    }`}
                  >
                    <div className={`h-12 w-full absolute top-0 left-0 z-0 ${
                      isInactive ? 'bg-slate-200' : 'bg-gradient-to-r from-[#40a8ab] to-[#2c8184]'
                    }`} />

                    <div className="pt-6 px-4 pb-4 flex flex-col items-center relative z-10">
                      <div className="size-16 bg-white rounded-xl shadow-sm border border-slate-100 p-2 flex items-center justify-center mb-3">
                        {useLogo && logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={fundacion.nombre}
                            className="w-full h-full object-contain"
                            onError={() => setFundacionLogoError((prev) => ({ ...prev, [fundacion.id]: true }))}
                          />
                        ) : (
                          <div
                            className="w-full h-full rounded-lg bg-cover bg-center"
                            style={{ backgroundImage: initialsBg }}
                          />
                        )}
                      </div>
                      
                      <h4 className="font-bold text-[#1A202C] text-sm text-center line-clamp-1">
                        {fundacion.nombre}
                      </h4>
                      
                      <div className="mt-2 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                        ${totalFormateado} aportados
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-500 text-sm">No tienes fundaciones activas aún.</p>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="h-px bg-slate-100 mx-6 mb-8" />

      {/* Header */}
      <header className="px-6 pb-4">
        <h1 className="text-2xl font-bold text-[#1A202C]">Configuración de Perfil</h1>
      </header>

      {/* Foto de perfil */}
      <section className="flex flex-col items-center py-6">
        <div className="relative">
          <div
            className="size-24 rounded-full bg-cover bg-center ring-4 ring-slate-50 shadow-sm"
            style={{
              backgroundImage: `url(https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre)}&background=16a459&color=fff&size=192)`,
            }}
          />
          <button className="absolute bottom-0 right-0 bg-[#40a8ab] text-white p-1.5 rounded-full border-2 border-white shadow-md active:scale-95 transition-transform hover:bg-[#40a8ab]/90">
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-3 text-[#40a8ab] text-xs font-bold uppercase tracking-wider">Cambiar Foto</p>
      </section>

      {/* Badge de Título/Estado */}
      <section className="px-6 mb-8">
        <div className={`border rounded-2xl p-4 flex items-center justify-between ${
          role === 'admin' 
            ? 'bg-purple-100/50 border-purple-200' 
            : isActive 
              ? 'bg-[#40a8ab]/5 border-[#40a8ab]/10' 
              : 'bg-slate-100/50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl text-white ${
              role === 'admin' ? 'bg-purple-600' : isActive ? 'bg-[#40a8ab]' : 'bg-slate-400'
            }`}>
              {role === 'admin' ? <Shield className="w-5 h-5" /> : isActive ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-sm font-bold text-[#1A202C]">
                {role === 'admin' ? 'Administrador' : 'Colaborador'}
              </p>
              <p className="text-[11px] text-slate-500">
                {role === 'admin' ? 'Acceso total al sistema' : isActive ? 'Suscripción al día' : 'Sin pagos activos'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300" />
        </div>
      </section>

      {/* Información Personal */}
      <section className="px-6 mb-8">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
          Información Personal
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">NOMBRE COMPLETO</label>
            <input
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-[#1A202C] focus:ring-2 focus:ring-[#40a8ab] focus:border-[#40a8ab] transition-all shadow-sm"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">CORREO ELECTRÓNICO</label>
            <input
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-[#1A202C] focus:ring-2 focus:ring-[#40a8ab] focus:border-[#40a8ab] transition-all shadow-sm"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">NÚMERO DE TELÉFONO</label>
            <input
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-[#1A202C] focus:ring-2 focus:ring-[#40a8ab] focus:border-[#40a8ab] transition-all shadow-sm"
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+54 9 11 1234-5678"
            />
          </div>

          {/* DNI — solo lectura */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">
              DNI <span className="text-slate-400 font-normal normal-case">(no modificable)</span>
            </label>
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 cursor-not-allowed shadow-sm"
              type="text"
              value={user.dni || '—'}
              disabled
              readOnly
            />
            <p className="mt-1 text-[10px] text-slate-400">El DNI no puede modificarse una vez registrado</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">PROVINCIA</label>
              <select
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-[#1A202C] focus:ring-2 focus:ring-[#40a8ab] focus:border-[#40a8ab] transition-all appearance-none cursor-pointer shadow-sm"
                value={provincia}
                onChange={(e) => setProvincia(e.target.value)}
              >
                <option value="">Seleccioná</option>
                {PROVINCIAS.map((prov) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">LOCALIDAD</label>
              <input
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-[#1A202C] focus:ring-2 focus:ring-[#40a8ab] focus:border-[#40a8ab] transition-all shadow-sm"
                type="text"
                value={localidad}
                onChange={(e) => setLocalidad(e.target.value)}
                placeholder="Tu ciudad"
              />
            </div>
          </div>

          <button
            onClick={handleGuardarPerfil}
            disabled={guardando}
            className="w-full bg-[#40a8ab] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#40a8ab]/20 active:scale-[0.98] transition-all mt-2 hover:bg-[#40a8ab]/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </section>

      {/* Cambio de contraseña */}
      <section className="px-6 mb-8">
        <button
          onClick={() => setMostrarCambioPass((v) => !v)}
          className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-[#40a8ab]/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-2 rounded-xl">
              <Lock className="w-5 h-5 text-slate-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-[#1A202C]">Cambiar Contraseña</p>
              <p className="text-[11px] text-slate-400">Actualizá tu contraseña de acceso</p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${mostrarCambioPass ? 'rotate-180' : ''}`} />
        </button>

        {mostrarCambioPass && (
          <div className="mt-3 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            {/* Contraseña actual */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">CONTRASEÑA ACTUAL</label>
              <div className="relative">
                <input
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm font-medium text-[#1A202C] focus:ring-2 focus:ring-[#40a8ab] focus:border-[#40a8ab] transition-all shadow-sm"
                  type={verPassActual ? 'text' : 'password'}
                  value={passActual}
                  onChange={(e) => setPassActual(e.target.value)}
                  placeholder="Tu contraseña actual"
                />
                <button
                  type="button"
                  onClick={() => setVerPassActual((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {verPassActual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Nueva contraseña */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">NUEVA CONTRASEÑA</label>
              <div className="relative">
                <input
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm font-medium text-[#1A202C] focus:ring-2 focus:ring-[#40a8ab] focus:border-[#40a8ab] transition-all shadow-sm"
                  type={verPassNueva ? 'text' : 'password'}
                  value={passNueva}
                  onChange={(e) => setPassNueva(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setVerPassNueva((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {verPassNueva ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmar nueva contraseña */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">CONFIRMAR NUEVA CONTRASEÑA</label>
              <div className="relative">
                <input
                  className={`w-full bg-white border rounded-xl px-4 py-3 pr-11 text-sm font-medium text-[#1A202C] focus:ring-2 focus:ring-[#40a8ab] focus:border-[#40a8ab] transition-all shadow-sm ${
                    passConfirmar && passNueva !== passConfirmar
                      ? 'border-red-300'
                      : 'border-slate-200'
                  }`}
                  type={verPassConfirmar ? 'text' : 'password'}
                  value={passConfirmar}
                  onChange={(e) => setPassConfirmar(e.target.value)}
                  placeholder="Repetí la nueva contraseña"
                />
                <button
                  type="button"
                  onClick={() => setVerPassConfirmar((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {verPassConfirmar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passConfirmar && passNueva !== passConfirmar && (
                <p className="mt-1 text-[10px] text-red-500">Las contraseñas no coinciden</p>
              )}
            </div>

            <div className="flex justify-start text-xs pt-1 pb-3">
              <Link href="/forgot-password" className="text-[#40a8ab] font-medium hover:underline hover:text-[#2c8184] transition-colors">
                ¿Olvidaste tu contraseña? Recuperala aquí
              </Link>
            </div>

            <button
              onClick={handleCambiarContrasena}
              disabled={cambiandoPass}
              className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl active:scale-[0.98] transition-all hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cambiandoPass ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
