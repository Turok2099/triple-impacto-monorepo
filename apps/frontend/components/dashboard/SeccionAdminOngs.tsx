"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { getOrganizaciones, createOrganizacion, updateOrganizacion, deleteOrganizacion, uploadLogo, Ong, permanentDeleteOrganizacion } from "@/lib/admin-ongs";
import { Plus, Edit2, Trash2, X, Building2, Link as LinkIcon, DollarSign, ShieldAlert, Key, Upload, Eye, EyeOff } from "lucide-react";

export default function SeccionAdminOngs() {
  const [ongs, setOngs] = useState<Ong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOng, setEditingOng] = useState<Ong | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState(false);



  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    logo_url: "",
    email: "",
    telefono: "",
    website_url: "",
    slug: "",
    monto_minimo: 5000,
    monto_fijo_1: 10000,
    monto_fijo_2: 20000,
    monto_fijo_3: 30000,
    activa: true,
    fiserv_activo: false,
    fiserv_store_id: "",
    fiserv_shared_secret: "",
    bonda_slug: "",
    bonda_api_token: "",
    bonda_api_token_nominas: "",
    bonda_microsite_id: ""
  });

  useEffect(() => {
    fetchOngs();
  }, []);

  const fetchOngs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token") || "";
      const data = await getOrganizaciones(token);
      setOngs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: "¿Desactivar ONG?",
      text: `¿Seguro que deseas dar de baja a ${name}? Ya no aparecerá para donaciones.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Sí, desactivar",
      cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("auth_token") || "";
      await deleteOrganizacion(token, id);
      Swal.fire("¡Desactivada!", "La ONG ha sido ocultada del sitio.", "success");
      fetchOngs();
    } catch (err: any) {
      Swal.fire("Error", "Error al desactivar: " + err.message, "error");
    }
  };

  const handlePermanentDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: "¿Eliminar permanentemente?",
      html: `¿Seguro que deseas eliminar <b>completamente</b> a ${name} de la base de datos?<br><br><b>¡Esta acción NO se puede deshacer!</b>`,
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Sí, eliminar definitivamente",
      cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("auth_token") || "";
      await permanentDeleteOrganizacion(token, id);
      Swal.fire("¡Eliminada!", "La ONG ha sido borrada completamente del sistema.", "success");
      fetchOngs();
    } catch (err: any) {
      Swal.fire("Error", "Error al eliminar: " + err.message, "error");
    }
  };

  const handleToggleStatus = async (ong: Ong) => {
    try {
      const token = localStorage.getItem("auth_token") || "";
      const newStatus = !ong.activa;

      // Actualización optimista de UI
      setOngs(ongs.map(o => o.id === ong.id ? { ...o, activa: newStatus } : o));

      await updateOrganizacion(token, ong.id, { activa: newStatus });
    } catch (err: any) {
      Swal.fire("Error", "No se pudo cambiar el estado: " + err.message, "error");
      fetchOngs(); // revertir si falla
    }
  };

  const handleToggleFiservStatus = async (ong: Ong) => {
    try {
      const token = localStorage.getItem("auth_token") || "";
      const newStatus = !ong.fiserv_activo;

      // Actualización optimista de UI
      setOngs(ongs.map(o => o.id === ong.id ? { ...o, fiserv_activo: newStatus } : o));

      await updateOrganizacion(token, ong.id, { fiserv_activo: newStatus });
    } catch (err: any) {
      Swal.fire("Error", "No se pudo cambiar el estado Fiserv: " + err.message, "error");
      fetchOngs(); // revertir si falla
    }
  };

  const openCreateModal = () => {
    setEditingOng(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setShowSecrets(false);
    setFormData({
      nombre: "", descripcion: "", logo_url: "", email: "", telefono: "", website_url: "",
      slug: "",
      monto_minimo: 5000,
      monto_fijo_1: 10000,
      monto_fijo_2: 20000,
      monto_fijo_3: 30000,
      activa: true, fiserv_activo: false, fiserv_store_id: "", fiserv_shared_secret: "", bonda_slug: "", bonda_api_token: "",
      bonda_api_token_nominas: "", bonda_microsite_id: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (ong: Ong) => {
    setEditingOng(ong);
    setSelectedFile(null);
    setPreviewUrl(null);
    const bonda = ong.bonda_microsites && ong.bonda_microsites.length > 0 ? ong.bonda_microsites[0] : null;

    setShowSecrets(false);
    setFormData({
      nombre: ong.nombre,
      descripcion: ong.descripcion || "",
      logo_url: ong.logo_url || "",
      email: ong.email || "",
      telefono: ong.telefono || "",
      website_url: ong.website_url || "",
      slug: ong.slug || "",
      monto_minimo: ong.monto_minimo || 5000,
      monto_fijo_1: ong.monto_fijo_1 || 10000,
      monto_fijo_2: ong.monto_fijo_2 || 20000,
      monto_fijo_3: ong.monto_fijo_3 || 30000,
      activa: ong.activa,
      fiserv_activo: ong.fiserv_activo || false,
      fiserv_store_id: ong.fiserv_store_id || "",
      fiserv_shared_secret: ong.fiserv_shared_secret || "",
      bonda_slug: bonda?.slug || "",
      bonda_api_token: bonda?.api_token || "",
      bonda_api_token_nominas: bonda?.api_token_nominas || "",
      bonda_microsite_id: bonda?.microsite_id || ""
    });
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token") || "";

      let finalLogoUrl = formData.logo_url;
      if (selectedFile) {
        // Mostrar alerta de que estamos subiendo
        Swal.fire({
          title: 'Subiendo imagen...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        finalLogoUrl = await uploadLogo(token, selectedFile);
      }

      const payload = { ...formData, logo_url: finalLogoUrl };

      if (editingOng) {
        await updateOrganizacion(token, editingOng.id, payload);
        Swal.fire("¡Actualizada!", "La ONG fue modificada con éxito.", "success");
      } else {
        await createOrganizacion(token, payload);
        Swal.fire("¡Creada!", "La ONG fue añadida al sistema.", "success");
      }
      setIsModalOpen(false);
      fetchOngs();
    } catch (err: any) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };



  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2c8184]"></div></div>;
  }

  if (error) {
    return <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 flex items-center gap-3"><ShieldAlert className="w-6 h-6" /><span>Error cargando ONGs: {error}</span></div>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-[#2c8184]" /> Gestor de ONGs y Fundaciones
        </h2>
        <div className="flex gap-2">
          <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-[#2c8184] hover:bg-[#1e6063] text-white rounded-xl font-semibold transition-all">
            <Plus className="w-4 h-4" /> Nueva ONG
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fundación</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Integraciones</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estados</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ongs.map((ong) => {
              const bonda = ong.bonda_microsites && ong.bonda_microsites.length > 0 ? ong.bonda_microsites[0] : null;
              return (
                <tr key={ong.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="size-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
                        {ong.logo_url ? <img src={ong.logo_url} alt="" className="w-full h-full object-contain" /> : <Building2 className="w-10 h-10 text-slate-400" />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{ong.nombre}</p>
                        <p className="text-xs text-slate-500 line-clamp-2 max-w-[200px]">{ong.descripcion || "Sin descripción"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1.5 items-start">
                      <div className="flex items-center gap-1 text-xs">
                        {(ong.fiserv_store_id && ong.fiserv_shared_secret) ? <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">FISERV OK</span> : <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-medium">SIN STORE PARA PAGO</span>}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        {bonda ? (
                          <a
                            href={bonda.slug.startsWith('http') ? bonda.slug : `https://${bonda.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-2 py-0.5 rounded font-semibold transition-colors flex items-center gap-1"
                          >
                            <LinkIcon className="w-2.5 h-2.5" />
                            Bonda: {bonda.slug.replace(/^https?:\/\//, '')}
                          </a>
                        ) : (
                          <span className="bg-red-50 text-red-500 px-2 py-0.5 rounded font-medium">Sin Bonda</span>
                        )}
                      </div>
                      {ong.slug && (
                        <div className="flex items-center gap-1 text-xs">
                          <a
                            href={`/donar/${ong.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-teal-50 text-[#2c8184] hover:bg-teal-100 px-2 py-0.5 rounded font-semibold transition-colors flex items-center gap-1"
                          >
                            <LinkIcon className="w-2.5 h-2.5" />
                            Donación: /{ong.slug}
                          </a>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium w-16 ${ong.activa ? 'text-[#2c8184]' : 'text-slate-400'}`}>
                          General
                        </span>
                        <button
                          onClick={() => handleToggleStatus(ong)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#2c8184] focus:ring-offset-2 ${ong.activa ? 'bg-[#2c8184]' : 'bg-slate-200'}`}
                          role="switch"
                          aria-checked={ong.activa}
                        >
                          <span className="sr-only">Habilitar ONG</span>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${ong.activa ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium w-16 ${ong.fiserv_activo ? 'text-blue-600' : 'text-slate-400'}`}>
                          Fiserv
                        </span>
                        <button
                          onClick={() => handleToggleFiservStatus(ong)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${ong.fiserv_activo ? 'bg-blue-500' : 'bg-slate-200'}`}
                          role="switch"
                          aria-checked={ong.fiserv_activo}
                        >
                          <span className="sr-only">Habilitar Fiserv</span>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${ong.fiserv_activo ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditModal(ong)} className="p-2 text-slate-400 hover:text-[#2c8184] hover:bg-emerald-50 rounded-lg transition-colors" title="Editar ONG">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handlePermanentDelete(ong.id, ong.nombre)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar ONG permanentemente">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#2c8184]" />
                {editingOng ? "Editar ONG" : "Nueva ONG"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh]">
              <div className="space-y-8">

                {/* 1. Datos Generales */}
                <section>
                  <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2"><Building2 className="w-5 h-5 text-slate-400" /> Información Pública</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre de la ONG *</label>
                      <input required value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Propósito / Descripción Breve</label>
                      <textarea rows={3} value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
                    </div>

                    <h4 className="col-span-2 text-sm font-bold text-slate-700 mt-2 mb-1">Información de Contacto</h4>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Email de Contacto</label>
                      <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Teléfono</label>
                      <input type="text" value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Sitio Web</label>
                      <input type="url" placeholder="https://..." value={formData.website_url} onChange={e => setFormData({ ...formData, website_url: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Slug de Donación Exclusivo (amigable)</label>
                      <input placeholder="ej: fundacion-padres (dejar vacío para deshabilitar exclusive link)" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                      <p className="text-xs text-slate-500 mt-1">
                        Si se define, la URL exclusiva será:{" "}
                        {formData.slug ? (
                          <span className="font-bold text-[#2c8184]">
                            /donar/{formData.slug}
                          </span>
                        ) : (
                          <span className="italic text-slate-500">/donar/nombre-slug</span>
                        )}
                      </p>
                    </div>

                    <h4 className="col-span-2 text-sm font-bold text-slate-700 mt-2 mb-1">Recursos Visuales</h4>

                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Logo de la Organización (JPG/PNG)</label>
                      <div className="flex items-start gap-4">
                        <div className="size-20 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
                          {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                          ) : formData.logo_url ? (
                            <img src={formData.logo_url} alt="Logo actual" className="w-full h-full object-contain" />
                          ) : (
                            <Building2 className="w-8 h-8 text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <label className="flex items-center justify-center w-full px-4 py-3 bg-white border-2 border-dashed border-emerald-200 rounded-xl cursor-pointer hover:bg-emerald-50 hover:border-emerald-400 transition-colors">
                            <div className="flex items-center gap-2 text-emerald-600 font-medium">
                              <Upload className="w-5 h-5" />
                              <span>{selectedFile ? selectedFile.name : 'Seleccionar archivo...'}</span>
                            </div>
                            <input type="file" className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={handleFileChange} />
                          </label>
                          <p className="text-xs text-slate-500 mt-2 font-medium">La imagen se subirá automáticamente a Supabase al guardar.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. Donaciones Fiserv */}
                <section>
                  <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-slate-400" strokeWidth={2.5} />
                      Pagos sugeridos
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Monto Mín.</label>
                      <input type="number" min="0" value={formData.monto_minimo} onChange={e => setFormData({ ...formData, monto_minimo: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Opción 1</label>
                      <input type="number" min="10000" value={formData.monto_fijo_1} onChange={e => setFormData({ ...formData, monto_fijo_1: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Opción 2</label>
                      <input type="number" min="10000" value={formData.monto_fijo_2} onChange={e => setFormData({ ...formData, monto_fijo_2: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Opción 3</label>
                      <input type="number" min="10000" value={formData.monto_fijo_3} onChange={e => setFormData({ ...formData, monto_fijo_3: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 flex items-center gap-3 mt-6">
                    <img src="https://res.cloudinary.com/dxbtafe9u/image/upload/v1781652396/Fiserv_logo.svg_veglfg.png" alt="Fiserv" className="h-10 object-contain select-none" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pasarela de Pagos</span>
                  </h3>
                  <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-orange-950 mb-1">Fiserv Store ID</label>
                        <input placeholder="Sin información" autoComplete="off" value={formData.fiserv_store_id} onChange={e => setFormData({ ...formData, fiserv_store_id: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-orange-200 focus:ring-2 focus:ring-orange-500 outline-none font-mono text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-orange-950 mb-1">Fiserv Shared Secret</label>
                        <div className="relative">
                          <input placeholder="Sin información" autoComplete="new-password" type={showSecrets ? "text" : "password"} value={formData.fiserv_shared_secret} onChange={e => setFormData({ ...formData, fiserv_shared_secret: e.target.value })} className="w-full px-4 py-2.5 pr-10 rounded-lg border border-orange-200 focus:ring-2 focus:ring-orange-500 outline-none font-mono text-sm" />
                          <button type="button" onClick={() => setShowSecrets(!showSecrets)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none">
                            {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 border-t border-orange-200/50 pt-4">
                      <input type="checkbox" id="fiserv_activo" checked={formData.fiserv_activo} onChange={e => setFormData({ ...formData, fiserv_activo: e.target.checked })} className="w-5 h-5 text-orange-600 rounded border-orange-300 focus:ring-orange-500" />
                      <label htmlFor="fiserv_activo" className="font-semibold text-orange-950">Fiserv Activo (Habilita la ONG en el formulario de pago, requiere store id)</label>
                    </div>
                  </div>
                </section>

                {/* 3. Integración Bonda */}
                <section>
                  <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2 mt-6">
                    <img src="https://res.cloudinary.com/dxbtafe9u/image/upload/v1781655035/bonda_ujsbcf.png" alt="Bonda" className="h-12 object-contain select-none" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Beneficios corporativos</span>
                  </h3>
                  <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-rose-950 mb-1">URL ONG + BONDA</label>
                      <input placeholder="ej: https://beneficios-mi-ong.bonda.com" value={formData.bonda_slug} onChange={e => setFormData({ ...formData, bonda_slug: e.target.value.trim().replace(/\/+$/, '') })} className="w-full px-4 py-2.5 rounded-lg border border-rose-200 focus:ring-2 focus:ring-rose-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-rose-950 mb-1">API Key de Cupones</label>
                      <p className="text-xs text-rose-600 mb-2">Usada para consultar el catálogo de beneficios.</p>
                      <div className="relative">
                        <input type={showSecrets ? "text" : "password"} placeholder="Token API Cupones" value={formData.bonda_api_token} onChange={e => setFormData({ ...formData, bonda_api_token: e.target.value })} className="w-full px-4 py-2.5 pr-10 rounded-lg border border-rose-200 focus:ring-2 focus:ring-rose-500 outline-none font-mono text-sm" />
                        <button type="button" onClick={() => setShowSecrets(!showSecrets)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none">
                          {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-rose-950 mb-1">API Key de Nóminas (Afiliados)</label>
                      <p className="text-xs text-rose-600 mb-2">Usada para crear/eliminar afiliados desde nuestro sistema.</p>
                      <div className="relative">
                        <input type={showSecrets ? "text" : "password"} placeholder="Token API Nóminas" value={formData.bonda_api_token_nominas} onChange={e => setFormData({ ...formData, bonda_api_token_nominas: e.target.value })} className="w-full px-4 py-2.5 pr-10 rounded-lg border border-rose-200 focus:ring-2 focus:ring-rose-500 outline-none font-mono text-sm" />
                        <button type="button" onClick={() => setShowSecrets(!showSecrets)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none">
                          {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-rose-950 mb-1">Bonda Microsite ID</label>
                      <input placeholder="ID numérico si aplica" value={formData.bonda_microsite_id} onChange={e => setFormData({ ...formData, bonda_microsite_id: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-rose-200 focus:ring-2 focus:ring-rose-500 outline-none font-mono text-sm" />
                    </div>
                  </div>
                </section>

              </div>

              <div className="mt-8 flex gap-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 px-4 bg-[#2c8184] hover:bg-[#1e6063] disabled:bg-emerald-400 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 transition-all flex justify-center items-center">
                  {submitting ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Guardar Organización'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
