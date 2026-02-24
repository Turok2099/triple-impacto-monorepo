"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Settings,
  CheckCircle,
  ChevronRight,
  CreditCard,
  PlusCircle,
  Camera,
} from "lucide-react";

export default function PerfilPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [dni, setDni] = useState("");
  const [provincia, setProvincia] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [guardando, setGuardando] = useState(false);

  const provincias = [
    "Buenos Aires",
    "CABA",
    "Catamarca",
    "Chaco",
    "Chubut",
    "Córdoba",
    "Corrientes",
    "Entre Ríos",
    "Formosa",
    "Jujuy",
    "La Pampa",
    "La Rioja",
    "Mendoza",
    "Misiones",
    "Neuquén",
    "Río Negro",
    "Salta",
    "San Juan",
    "San Luis",
    "Santa Cruz",
    "Santa Fe",
    "Santiago del Estero",
    "Tierra del Fuego",
    "Tucumán",
  ];

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    // Cargar datos del usuario
    setNombre(user.nombre || "");
    setEmail(user.email || "");
    setTelefono(user.telefono || "");
    setDni(user.dni || "");
    setProvincia(user.provincia || "");
    setLocalidad(user.localidad || "");
  }, [user, authLoading, router]);

  const handleGuardarCambios = async () => {
    setGuardando(true);
    try {
      // TODO: Implementar actualización de perfil
      console.log("Guardando cambios:", {
        nombre,
        email,
        telefono,
        dni,
        provincia,
        localidad,
      });
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simular llamada API
      alert("Cambios guardados exitosamente");
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      alert("Error al guardar cambios");
    } finally {
      setGuardando(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16a459] mx-auto mb-4"></div>
          <p className="text-[#1A202C]">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="px-6 pt-12 pb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1A202C]">
            Configuración de Perfil
          </h1>
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            <Settings className="w-6 h-6" />
          </button>
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
            <button className="absolute bottom-0 right-0 bg-[#16a459] text-white p-1.5 rounded-full border-2 border-white shadow-md active:scale-95 transition-transform hover:bg-[#16a459]/90">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-3 text-[#16a459] text-xs font-bold uppercase tracking-wider">
            Cambiar Foto
          </p>
        </section>

        {/* Badge de miembro activo */}
        <section className="px-6 mb-8">
          <div className="bg-[#16a459]/5 border border-[#16a459]/10 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#16a459] text-white p-2 rounded-xl">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1A202C]">
                  Miembro Activo
                </p>
                <p className="text-[11px] text-slate-500">
                  Miembro desde{" "}
                  {new Date().toLocaleDateString("es-AR", {
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300" />
          </div>
        </section>

        {/* Información Personal */}
        <section className="px-6 mb-10">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
            Información Personal
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">
                NOMBRE COMPLETO
              </label>
              <input
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-[#1A202C] focus:ring-2 focus:ring-[#16a459] focus:border-[#16a459] transition-all shadow-sm"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">
                CORREO ELECTRÓNICO
              </label>
              <input
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-[#1A202C] focus:ring-2 focus:ring-[#16a459] focus:border-[#16a459] transition-all shadow-sm"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">
                NÚMERO DE TELÉFONO
              </label>
              <input
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-[#1A202C] focus:ring-2 focus:ring-[#16a459] focus:border-[#16a459] transition-all shadow-sm"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+54 9 11 1234-5678"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">
                DNI
              </label>
              <input
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-[#1A202C] focus:ring-2 focus:ring-[#16a459] focus:border-[#16a459] transition-all shadow-sm"
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="12345678"
                maxLength={8}
              />
              <p className="mt-1 text-[10px] text-slate-500">
                Tu DNI es necesario para crear tu cuenta en Bonda
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">
                  PROVINCIA
                </label>
                <select
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-[#1A202C] focus:ring-2 focus:ring-[#16a459] focus:border-[#16a459] transition-all appearance-none cursor-pointer shadow-sm"
                  value={provincia}
                  onChange={(e) => setProvincia(e.target.value)}
                >
                  <option value="">Seleccioná</option>
                  {provincias.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 ml-1">
                  LOCALIDAD
                </label>
                <input
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-[#1A202C] focus:ring-2 focus:ring-[#16a459] focus:border-[#16a459] transition-all shadow-sm"
                  type="text"
                  value={localidad}
                  onChange={(e) => setLocalidad(e.target.value)}
                  placeholder="Tu ciudad"
                />
              </div>
            </div>
            <button
              onClick={handleGuardarCambios}
              disabled={guardando}
              className="w-full bg-[#16a459] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#16a459]/20 active:scale-[0.98] transition-all mt-2 hover:bg-[#16a459]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardando ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </section>

        {/* Métodos de Pago */}
        <section className="px-6 mb-12">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
            Métodos de Pago
          </h2>
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl bg-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-slate-100 rounded flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1A202C]">
                    Visa terminada en 4242
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Vence 12/26
                  </p>
                </div>
              </div>
              <button className="text-[#16a459] text-xs font-bold px-3 py-1 bg-[#16a459]/5 rounded-lg hover:bg-[#16a459]/10 transition-colors">
                Editar
              </button>
            </div>
          </div>
          <button className="w-full border-2 border-dashed border-[#16a459]/30 text-[#16a459] font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 bg-[#16a459]/5 hover:bg-[#16a459]/10 transition-colors">
            <PlusCircle className="w-5 h-5" />
            Agregar Método de Pago
          </button>
        </section>

        {/* Botón de cerrar sesión */}
        <section className="px-6 mb-12">
          <button
            onClick={logout}
            className="w-full border-2 border-red-200 text-red-600 font-bold py-3.5 rounded-xl hover:bg-red-50 transition-colors"
          >
            Cerrar Sesión
          </button>
        </section>
      </div>
    </div>
  );
}
