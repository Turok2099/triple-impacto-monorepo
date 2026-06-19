'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  actualizarPerfil, 
  cambiarContrasena, 
  obtenerMisDonaciones,
  reenviarComprobante,
  DonacionResumen, 
  DashboardUsuario 
} from '@/lib/dashboard';
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
  LayoutDashboard,
  Receipt,
  Settings,
  Mail,
  Building2,
  Calendar,
  Download,
  AlertCircle,
  RotateCcw,
  Check
} from 'lucide-react';
import { getOrganizationLogoUrl } from '@/lib/organization-logos';

const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
  'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
  'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán',
];

type ProfileTab = 'resumen' | 'suscripcion' | 'historial' | 'ajustes';

interface SeccionPerfilProps {
  isActive?: boolean;
  role?: string;
  dashboard?: DashboardUsuario | null;
}

function formatMoneda(moneda: string): string {
  if (moneda === '032' || moneda === 'ARS') return 'ARS';
  return moneda;
}

function formatMonto(monto: string, moneda: string): string {
  const num = parseFloat(monto);
  if (Number.isNaN(num)) return monto;
  const symbol = formatMoneda(moneda) === 'ARS' ? '$' : '';
  return `${symbol}${num.toLocaleString('es-AR')}`;
}

export default function SeccionPerfil({ isActive = false, role = 'user', dashboard }: SeccionPerfilProps) {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('resumen');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  // Camera & Dropdown States
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cleanup camera stream on unmount or stream change
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Toasts
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

  // Historial de Pagos
  const [donaciones, setDonaciones] = useState<DonacionResumen[]>([]);
  const [cargandoPagos, setCargandoPagos] = useState(false);
  const [errorPagos, setErrorPagos] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setNombre(user.nombre || '');
    setEmail(user.email || '');
    setTelefono(user.telefono || '');
    setProvincia(user.provincia || '');
    setLocalidad(user.localidad || '');
  }, [user]);

  useEffect(() => {
    if (activeTab === 'historial' && donaciones.length === 0) {
      cargarDonaciones();
    }
  }, [activeTab]);

  const cargarDonaciones = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      setCargandoPagos(true);
      setErrorPagos(null);
      const data = await obtenerMisDonaciones(token);
      setDonaciones(data);
    } catch (err) {
      console.error('Error al cargar pagos:', err);
      setErrorPagos('No se pudieron cargar tus pagos. Intentá de nuevo.');
    } finally {
      setCargandoPagos(false);
    }
  };

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

  const subirAvatar = async (fileOrBlob: Blob | File, fileName = 'avatar.jpg') => {
    const token = localStorage.getItem('auth_token');
    if (!token) return false;

    setSubiendoFoto(true);
    try {
      const formData = new FormData();
      const file = fileOrBlob instanceof File 
        ? fileOrBlob 
        : new File([fileOrBlob], fileName, { type: 'image/jpeg' });

      formData.append('file', file);
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const res = await fetch(`${API_URL}/auth/profile/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Error al subir la imagen');
      }

      const data = await res.json();
      updateUser({ avatar_url: data.avatar_url });
      mostrarToast('ok', 'Foto de perfil actualizada correctamente');
      return true;
    } catch (error: any) {
      mostrarToast('error', error.message || 'Ocurrió un error al subir la foto');
      return false;
    } finally {
      setSubiendoFoto(false);
    }
  };

  const handleSubirFoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      mostrarToast('error', 'La imagen no debe superar los 2MB');
      return;
    }

    const success = await subirAvatar(file);
    if (success && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const iniciarCamara = async () => {
    setCameraLoading(true);
    setCameraError(null);
    setCapturedPhoto(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false
      });
      setCameraStream(stream);
      // Esperar un instante para que se renderice el ref
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);
    } catch (err: any) {
      console.error('Error al acceder a la cámara:', err);
      setCameraError('No se pudo acceder a la cámara. Verificá los permisos de tu navegador.');
    } finally {
      setCameraLoading(false);
    }
  };

  const detenerCamara = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const capturarFoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 640;
        canvas.width = width;
        canvas.height = height;

        // Espejado horizontal
        context.translate(width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedPhoto(dataUrl);
      }
    }
  };

  const cerrarCameraModal = () => {
    detenerCamara();
    setShowCameraModal(false);
    setCapturedPhoto(null);
    setCameraError(null);
  };

  const handleGuardarFotoCamara = async () => {
    if (!capturedPhoto) return;
    try {
      // Conversión manual de base64 a Blob para máxima compatibilidad móvil (evita bloqueos de fetch en iOS/Android)
      const parts = capturedPhoto.split(';base64,');
      const contentType = parts[0].split(':')[1] || 'image/jpeg';
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      
      const blob = new Blob([uInt8Array], { type: contentType });
      const success = await subirAvatar(blob, 'avatar-camara.jpg');
      if (success) {
        cerrarCameraModal();
      }
    } catch (err) {
      console.error('Error al subir foto de cámara:', err);
      mostrarToast('error', 'Error al procesar la imagen de la cámara');
    }
  };

  const handleReenviarComprobante = async (id: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      await reenviarComprobante(id, token);
      mostrarToast('ok', 'Comprobante reenviado a tu correo');
    } catch (error: any) {
      mostrarToast('error', error.message || 'Error al reenviar comprobante');
    }
  };

  if (!user) return null;

  const totalDonadoHistorial = donaciones.reduce((sum, d) => sum + parseFloat(d.monto || '0'), 0);

  return (
    <div className="max-w-6xl mx-auto w-full pt-8 pb-12 px-4 sm:px-6 flex flex-col lg:flex-row gap-8">
      {/* Toast flotante */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold transition-all animate-in fade-in slide-in-from-bottom-4 ${
          toast.tipo === 'ok' ? 'bg-[#40a8ab] text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.tipo === 'ok' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
          {toast.texto}
        </div>
      )}

      {/* Sidebar / Tabs Navigation */}
      <aside className="lg:w-64 shrink-0">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] sticky top-28">
          
          {/* User Info Compact */}
          <div className="flex items-center gap-4 mb-8 relative">
            <div className="relative group cursor-pointer shrink-0" onClick={() => !subiendoFoto && setShowPhotoOptions(true)}>
              <div
                className={`size-14 rounded-full bg-cover bg-center ring-2 ring-slate-100 shrink-0 transition-opacity ${subiendoFoto ? 'opacity-50' : 'group-hover:opacity-80'}`}
                style={{
                  backgroundImage: `url(${user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre)}&background=16a459&color=fff&size=128`})`,
                }}
              />
              {!subiendoFoto && (
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              )}
              {subiendoFoto && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-[#40a8ab] border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <input type="file" ref={fileInputRef} onChange={handleSubirFoto} accept="image/png, image/jpeg, image/webp" className="hidden" />

            {/* Dropdown de opciones de foto */}
            {showPhotoOptions && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowPhotoOptions(false)} />
                <div className="absolute left-0 top-16 mt-1 w-44 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    onClick={() => {
                      setShowPhotoOptions(false);
                      setShowCameraModal(true);
                      iniciarCamara();
                    }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all text-left"
                  >
                    <Camera className="w-4 h-4 text-[#40a8ab]" />
                    Usar Cámara
                  </button>
                  <button
                    onClick={() => {
                      setShowPhotoOptions(false);
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all text-left"
                  >
                    <PlusCircle className="w-4 h-4 text-[#40a8ab]" />
                    Subir Archivo
                  </button>
                </div>
              </>
            )}

            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-800 text-sm break-words whitespace-normal leading-tight">{user.nombre}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {isActive ? <CheckCircle className="w-3.5 h-3.5 text-[#40a8ab]" /> : <AlertCircle className="w-3.5 h-3.5 text-slate-400" />}
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  {isActive ? 'Suscripción Activa' : 'Sin Suscripción'}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('resumen')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                activeTab === 'resumen' 
                  ? 'bg-[#40a8ab]/10 text-[#40a8ab]' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" strokeWidth={activeTab === 'resumen' ? 2.5 : 2} />
              Impacto
            </button>

            <button
              onClick={() => setActiveTab('suscripcion')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                activeTab === 'suscripcion' 
                  ? 'bg-[#40a8ab]/10 text-[#40a8ab]' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <CreditCard className="w-5 h-5" strokeWidth={activeTab === 'suscripcion' ? 2.5 : 2} />
              Mi Suscripción
            </button>

            <button
              onClick={() => setActiveTab('historial')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                activeTab === 'historial' 
                  ? 'bg-[#40a8ab]/10 text-[#40a8ab]' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Receipt className="w-5 h-5" strokeWidth={activeTab === 'historial' ? 2.5 : 2} />
              Historial de Pagos
            </button>

            <button
              onClick={() => setActiveTab('ajustes')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                activeTab === 'ajustes' 
                  ? 'bg-[#40a8ab]/10 text-[#40a8ab]' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Settings className="w-5 h-5" strokeWidth={activeTab === 'ajustes' ? 2.5 : 2} />
              Ajustes de Perfil
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        
        {/* === TAB: RESUMEN DE IMPACTO === */}
        {activeTab === 'resumen' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-slate-800">Mi Impacto</h2>
            
            {dashboard && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-teal-50 rounded-lg"><Heart className="w-5 h-5 text-[#40a8ab]" /></div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Donado</span>
                  </div>
                  <p className="text-3xl font-extrabold text-slate-800">
                    ${dashboard.estadisticas?.totalDonado?.toLocaleString("es-AR") || "0"}
                  </p>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-teal-50 rounded-lg"><CheckCircle2 className="w-5 h-5 text-[#40a8ab]" /></div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cupones Usados</span>
                  </div>
                  <p className="text-3xl font-extrabold text-slate-800">
                    {dashboard.estadisticas?.cuponesUsados || 0}
                  </p>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-teal-50 rounded-lg"><Ticket className="w-5 h-5 text-[#40a8ab]" /></div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cupones Activos</span>
                  </div>
                  <p className="text-3xl font-extrabold text-slate-800">
                    {dashboard.estadisticas?.cuponesActivos || 0}
                  </p>
                </div>
              </div>
            )}

            {/* My Foundations */}
            {dashboard && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Organizaciones a las que apoyo</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {dashboard.fundaciones && dashboard.fundaciones.length > 0 ? (
                    dashboard.fundaciones.map((fundacion) => {
                      const logoUrl = getOrganizationLogoUrl(fundacion.nombre, fundacion.slug);
                      const useLogo = !!logoUrl && !fundacionLogoError[fundacion.id];
                      const initialsBg = `url(https://ui-avatars.com/api/?name=${encodeURIComponent(fundacion.nombre)}&background=16a459&color=fff&size=128)`;
                      const totalFormateado = (fundacion.totalDonado ?? 0).toLocaleString("es-AR");
                      const isInactive = fundacion.isActive === false;
                      
                      return (
                        <div key={fundacion.id} className={`flex items-center gap-4 p-4 rounded-3xl border ${isInactive ? 'bg-slate-50 border-slate-200 grayscale opacity-75' : 'bg-white border-slate-100 shadow-sm'}`}>
                          <div className="size-14 rounded-2xl bg-white border border-slate-100 p-1 flex items-center justify-center shrink-0">
                            {useLogo && logoUrl ? (
                              <img src={logoUrl} alt={fundacion.nombre} className="w-full h-full object-contain" onError={() => setFundacionLogoError((prev) => ({ ...prev, [fundacion.id]: true }))} />
                            ) : (
                              <div className="w-full h-full rounded-xl bg-cover bg-center" style={{ backgroundImage: initialsBg }} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-800 text-sm truncate">{fundacion.nombre}</h4>
                            <p className="text-xs text-[#40a8ab] font-bold mt-1">${totalFormateado} aportados</p>
                          </div>
                          {isInactive && <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded-full font-bold">Inactiva</span>}
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                      <p className="text-slate-500 text-sm">Aún no estás apoyando a ninguna organización.</p>
                      <Link href="/donar" className="inline-block mt-3 text-[#40a8ab] text-sm font-bold hover:underline">Comenzar a donar</Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* === TAB: MI SUSCRIPCIÓN === */}
        {activeTab === 'suscripcion' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Suscripción y Pago</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Resumen Suscripción (Mocked UI awaiting Backend connect) */}
              <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] border border-slate-100">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-5">Estado Actual</h3>
                
                <div className="flex flex-col gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {isActive ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                      <span className="font-bold text-slate-800 text-lg">
                        {isActive ? 'Suscripción Activa' : 'Sin Suscripción'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">Tu aporte nos ayuda a seguir generando impacto.</p>
                  </div>

                  {isActive && (
                    <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center border border-slate-100">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Monto Mensual</p>
                        <p className="text-2xl font-extrabold text-slate-800 mt-1">
                          ${dashboard?.estadisticas?.totalDonado ? Math.round(dashboard.estadisticas.totalDonado / (dashboard.fundaciones?.length || 1)).toLocaleString("es-AR") : "0"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-500 uppercase">Próximo Cobro</p>
                        <p className="text-sm font-bold text-slate-700 mt-1">
                          Próximo mes
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button disabled className="w-full bg-slate-100 text-slate-400 font-bold py-3 rounded-xl transition-all cursor-not-allowed">
                      Modificar Suscripción
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-2">Función disponible próximamente.</p>
                  </div>
                </div>
              </div>

              {/* Método de pago (Mocked UI based on DB fiserv_raw_response extraction) */}
              <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] border border-slate-100">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-5">Método de Pago</h3>
                
                {isActive ? (
                  <div className="flex flex-col gap-6">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white relative overflow-hidden shadow-lg">
                      {/* Decorative elements */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4"></div>
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-center mb-6">
                          <CreditCard className="w-6 h-6 text-slate-300" />
                          <span className="text-xs font-bold tracking-widest text-slate-300 uppercase">{dashboard?.metodoPago?.brand || 'Fiserv'}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg tracking-[0.2em] font-medium opacity-80">••••</span>
                          <span className="text-lg tracking-[0.2em] font-medium opacity-80">••••</span>
                          <span className="text-lg tracking-[0.2em] font-medium opacity-80">••••</span>
                          <span className="text-lg tracking-widest font-bold">{dashboard?.metodoPago?.last4 || 'XXXX'}</span>
                        </div>
                        
                        <div className="flex justify-between items-end">
                          <p className="text-xs font-medium opacity-80 uppercase tracking-wider">{user.nombre}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button disabled className="w-full bg-slate-100 text-slate-400 font-bold py-3 rounded-xl transition-all cursor-not-allowed">
                        Actualizar Tarjeta
                      </button>
                      <p className="text-[10px] text-center text-slate-400 mt-2">Para cambiar la tarjeta, deberás esperar la actualización.</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-6">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <CreditCard className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 text-sm mb-4">No tienes tarjetas asociadas actualmente.</p>
                    <Link href="/donar" className="bg-[#40a8ab] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-[#2c8184] transition-colors">
                      Agregar Método
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* === TAB: HISTORIAL DE PAGOS === */}
        {activeTab === 'historial' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Historial de Pagos</h2>
                <p className="text-sm text-slate-500">Listado de todas tus donaciones realizadas.</p>
              </div>
              <div className="bg-teal-50 text-[#40a8ab] px-4 py-2 rounded-xl border border-teal-100 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                <span className="text-sm font-bold">Total: ${totalDonadoHistorial.toLocaleString('es-AR')}</span>
              </div>
            </div>

            {cargandoPagos ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#40a8ab]"></div>
              </div>
            ) : errorPagos ? (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium">{errorPagos}</div>
            ) : donaciones.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
                <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800 mb-2">Aún no hay pagos registrados</h3>
                <p className="text-slate-500 text-sm mb-6">Cuando realices una donación aparecerá aquí.</p>
                <Link href="/donar" className="inline-block bg-[#40a8ab] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-[#40a8ab]/20 hover:bg-[#2c8184] transition-all">
                  Hacer mi primer aporte
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                        <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Organización</th>
                        <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Monto</th>
                        <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {donaciones.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="text-sm font-medium whitespace-nowrap">
                                {new Date(d.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="font-bold text-slate-800 text-sm truncate max-w-[150px] sm:max-w-xs">
                                {d.organizacion_nombre || 'Donación general'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className="font-extrabold text-[#40a8ab] whitespace-nowrap">
                              {formatMonto(d.monto, d.moneda)}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-medium uppercase mt-0.5">
                              {d.metodo_pago || 'Pago'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <button
                              onClick={() => handleReenviarComprobante(d.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-[#40a8ab] hover:border-[#40a8ab] text-xs font-bold rounded-lg shadow-sm transition-all"
                              title="Reenviar comprobante al mail"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Reenviar</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* === TAB: AJUSTES DE PERFIL === */}
        {activeTab === 'ajustes' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Ajustes Personales</h2>

            {/* Información Personal */}
            <section className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] border border-slate-100 mb-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-5">
                Tus Datos
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">NOMBRE COMPLETO</label>
                  <input
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-[#40a8ab] focus:border-[#40a8ab] transition-all shadow-sm"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">CORREO ELECTRÓNICO</label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 cursor-not-allowed shadow-sm"
                    type="email"
                    value={email}
                    disabled
                    readOnly
                  />
                  <p className="mt-1 ml-1 text-[10px] text-slate-400">El correo no se puede modificar.</p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">TELÉFONO</label>
                  <input
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-[#40a8ab] focus:border-[#40a8ab] transition-all shadow-sm"
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+54 9 11 1234-5678"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">DNI</label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 cursor-not-allowed shadow-sm"
                    type="text"
                    value={user.dni || '—'}
                    disabled
                    readOnly
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">PROVINCIA</label>
                    <select
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-[#40a8ab] focus:border-[#40a8ab] transition-all appearance-none cursor-pointer shadow-sm"
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
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-[#40a8ab] focus:border-[#40a8ab] transition-all shadow-sm"
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
                  className="w-full bg-[#40a8ab] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#40a8ab]/20 active:scale-[0.98] transition-all mt-4 hover:bg-[#2c8184] disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar Datos Personales'}
                </button>
              </div>
            </section>

            {/* Seguridad */}
            <section className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] border border-slate-100">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-5">
                Seguridad
              </h3>
              
              <button
                onClick={() => setMostrarCambioPass((v) => !v)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                    <Lock className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800">Cambiar Contraseña</p>
                    <p className="text-[11px] text-slate-500">Actualizá tu clave de acceso</p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${mostrarCambioPass ? 'rotate-180' : ''}`} />
              </button>

              {mostrarCambioPass && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">CONTRASEÑA ACTUAL</label>
                    <div className="relative">
                      <input
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm font-medium focus:ring-2 focus:ring-[#40a8ab] focus:border-[#40a8ab] transition-all shadow-sm"
                        type={verPassActual ? 'text' : 'password'}
                        value={passActual}
                        onChange={(e) => setPassActual(e.target.value)}
                        placeholder="Tu contraseña actual"
                      />
                      <button type="button" onClick={() => setVerPassActual((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {verPassActual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">NUEVA CONTRASEÑA</label>
                    <div className="relative">
                      <input
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm font-medium focus:ring-2 focus:ring-[#40a8ab] focus:border-[#40a8ab] transition-all shadow-sm"
                        type={verPassNueva ? 'text' : 'password'}
                        value={passNueva}
                        onChange={(e) => setPassNueva(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                      />
                      <button type="button" onClick={() => setVerPassNueva((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {verPassNueva ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">CONFIRMAR NUEVA CONTRASEÑA</label>
                    <div className="relative">
                      <input
                        className={`w-full bg-white border rounded-xl px-4 py-3 pr-11 text-sm font-medium focus:ring-2 focus:ring-[#40a8ab] transition-all shadow-sm ${passConfirmar && passNueva !== passConfirmar ? 'border-red-300' : 'border-slate-200'}`}
                        type={verPassConfirmar ? 'text' : 'password'}
                        value={passConfirmar}
                        onChange={(e) => setPassConfirmar(e.target.value)}
                        placeholder="Repetí la nueva contraseña"
                      />
                      <button type="button" onClick={() => setVerPassConfirmar((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {verPassConfirmar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passConfirmar && passNueva !== passConfirmar && (
                      <p className="mt-1 text-[10px] text-red-500 ml-1">Las contraseñas no coinciden</p>
                    )}
                  </div>

                  <button
                    onClick={handleCambiarContrasena}
                    disabled={cambiandoPass}
                    className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-all mt-2"
                  >
                    {cambiandoPass ? 'Actualizando...' : 'Actualizar Contraseña'}
                  </button>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Modal de Cámara */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#40a8ab]" />
                Tomar Foto de Perfil
              </h3>
              <button
                onClick={cerrarCameraModal}
                className="p-1.5 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Video/Preview Area */}
            <div className="p-6 flex flex-col items-center justify-center bg-slate-50 relative min-h-[320px]">
              {cameraLoading && (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-[#40a8ab] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-slate-500">Iniciando cámara...</p>
                </div>
              )}

              {cameraError && (
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">{cameraError}</p>
                  <button
                    onClick={iniciarCamara}
                    className="mt-4 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition-all"
                  >
                    Reintentar
                  </button>
                </div>
              )}

              {!cameraLoading && !cameraError && (
                <div className="relative w-72 h-72 rounded-full overflow-hidden border-4 border-white shadow-md bg-slate-200">
                  {!capturedPhoto ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <img
                      src={capturedPhoto}
                      alt="Captura"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              )}
              
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Actions Footer */}
            <div className="px-6 py-5 bg-white border-t border-slate-100 flex gap-3 justify-end">
              {!capturedPhoto ? (
                <>
                  <button
                    onClick={cerrarCameraModal}
                    className="px-5 py-2.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={capturarFoto}
                    disabled={cameraLoading || !!cameraError}
                    className="px-5 py-2.5 bg-[#40a8ab] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#40a8ab]/20 hover:bg-[#2c8184] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" />
                    Capturar
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setCapturedPhoto(null)}
                    className="px-5 py-2.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Tomar otra
                  </button>
                  <button
                    onClick={handleGuardarFotoCamara}
                    disabled={subiendoFoto}
                    className="px-5 py-2.5 bg-[#40a8ab] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#40a8ab]/20 hover:bg-[#2c8184] transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {subiendoFoto ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Guardar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
