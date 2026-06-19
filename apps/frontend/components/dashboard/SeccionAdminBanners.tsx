"use client";

import { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import { getAdminBanners, createBanner, updateBanner, deleteBanner, uploadBannerImage, Banner } from "@/lib/admin";
import { Image as ImageIcon, Plus, Edit2, Trash2, X, ExternalLink, ArrowUp, ArrowDown, CheckCircle, XCircle, Save, Loader2 } from "lucide-react";

export default function SeccionAdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    image_url: "",
    link_url: "",
    is_active: true,
    order: 0
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token") || "";
      const data = await getAdminBanners(token);
      setBanners(data);
    } catch (err: any) {
      console.error(err);
      Swal.fire('Error', 'No se pudieron cargar los banners', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title,
        image_url: banner.image_url,
        link_url: banner.link_url || "",
        is_active: banner.is_active,
        order: banner.order
      });
    } else {
      setEditingBanner(null);
      setFormData({
        title: "",
        image_url: "",
        link_url: "",
        is_active: true,
        order: banners.length > 0 ? Math.max(...banners.map(b => b.order)) + 1 : 0
      });
    }
    setIsModalOpen(true);
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxWidth = 1200;

          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Error al procesar imagen'));
            }
          }, 'image/webp', 0.8);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // Optimizar imagen antes de subir
      const optimizedFile = await compressImage(file);
      
      const token = localStorage.getItem("auth_token") || "";
      const res = await uploadBannerImage(token, optimizedFile);
      setFormData({ ...formData, image_url: res.url });
      Swal.fire({
        title: 'Imagen optimizada y subida',
        text: 'Se ha convertido a WebP para mejor rendimiento',
        icon: 'success',
        toast: true,
        position: 'top-end',
        timer: 3000,
        showConfirmButton: false
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire('Error', 'No se pudo subir la imagen optimizada.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) {
      Swal.fire('Atención', 'Debes subir una imagen para el banner', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token") || "";
      if (editingBanner) {
        await updateBanner(token, editingBanner.id, formData);
        Swal.fire('Actualizado', 'Banner actualizado correctamente', 'success');
      } else {
        await createBanner(token, formData);
        Swal.fire('Creado', 'Banner creado correctamente', 'success');
      }
      setIsModalOpen(false);
      fetchBanners();
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (banner: Banner) => {
    try {
      const token = localStorage.getItem("auth_token") || "";
      await updateBanner(token, banner.id, { is_active: !banner.is_active });
      fetchBanners();
    } catch (err: any) {
      Swal.fire('Error', 'No se pudo cambiar el estado', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar banner?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("auth_token") || "";
      await deleteBanner(token, id);
      Swal.fire('Eliminado', 'El banner ha sido eliminado', 'success');
      fetchBanners();
    } catch (err: any) {
      Swal.fire('Error', 'No se pudo eliminar el banner', 'error');
    }
  };

  const handleMove = async (banner: Banner, direction: 'up' | 'down') => {
    const currentIndex = banners.findIndex(b => b.id === banner.id);
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === banners.length - 1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const targetBanner = banners[targetIndex];

    try {
      const token = localStorage.getItem("auth_token") || "";
      // Swap orders
      const tempOrder = banner.order;
      await updateBanner(token, banner.id, { order: targetBanner.order });
      await updateBanner(token, targetBanner.id, { order: tempOrder });
      fetchBanners();
    } catch (err: any) {
      Swal.fire('Error', 'No se pudo cambiar el orden', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-[#2c8184]" />
          Gestión de Banners (Carrusel Home)
        </h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-[#2c8184] hover:bg-[#1e6063] text-white rounded-xl font-semibold transition-all shadow-md"
        >
          <Plus className="w-5 h-5" />
          Nuevo Banner
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#2c8184]" />
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No hay banners configurados</p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-4 text-[#2c8184] font-bold hover:underline"
          >
            Crear el primer banner
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Orden</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Banner</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase text-center">Estado</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {banners.map((banner, index) => (
                <tr key={banner.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-400 w-4">{banner.order}</span>
                      <div className="flex flex-col">
                        <button 
                          onClick={() => handleMove(banner, 'up')}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-[#2c8184] disabled:opacity-30"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleMove(banner, 'down')}
                          disabled={index === banners.length - 1}
                          className="p-1 text-slate-400 hover:text-[#2c8184] disabled:opacity-30"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-16 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                        <img 
                          src={banner.image_url} 
                          alt={banner.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{banner.title}</p>
                        {banner.link_url && (
                          <a 
                            href={banner.link_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-[#2c8184] hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {banner.link_url}
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => handleToggleStatus(banner)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        banner.is_active 
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {banner.is_active ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {banner.is_active ? 'ACTIVO' : 'INACTIVO'}
                    </button>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(banner)}
                        className="p-2 text-slate-400 hover:text-[#2c8184] hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Creación/Edición */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">
                {editingBanner ? "Editar Banner" : "Nuevo Banner"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Título / Identificador</label>
                  <input 
                    required 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    placeholder="Ej: Banner de Bienvenida"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Imagen del Banner</label>
                  <div className="mt-1 flex flex-col gap-3">
                    {formData.image_url && (
                      <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden border border-slate-200">
                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, image_url: ""})}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-center w-full">
                      <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${uploading ? 'bg-slate-50 border-slate-200' : 'bg-slate-50 border-slate-300 hover:bg-slate-100 hover:border-[#2c8184]'}`}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {uploading ? (
                            <Loader2 className="w-8 h-8 animate-spin text-[#2c8184] mb-2" />
                          ) : (
                            <Plus className="w-8 h-8 text-slate-400 mb-2" />
                          )}
                          <p className="text-sm text-slate-500">
                            {uploading ? 'Subiendo...' : formData.image_url ? 'Cambiar imagen' : 'Haz clic para subir imagen'}
                          </p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Enlace de destino (opcional)</label>
                  <input 
                    type="url"
                    value={formData.link_url} 
                    onChange={e => setFormData({...formData, link_url: e.target.value})} 
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Orden</label>
                    <input 
                      type="number"
                      required 
                      value={formData.order} 
                      onChange={e => setFormData({...formData, order: parseInt(e.target.value)})} 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" 
                    />
                  </div>
                  <div className="flex items-end pb-3">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div 
                        onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                        className={`w-12 h-6 rounded-full transition-all relative ${formData.is_active ? 'bg-[#2c8184]' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_active ? 'left-7' : 'left-1'}`} />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">Activo</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl transition-colors">
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={submitting || uploading} 
                  className="flex-1 py-3 px-4 bg-[#2c8184] hover:bg-[#1e6063] disabled:bg-slate-300 text-white font-semibold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2"
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {editingBanner ? 'Guardar Cambios' : 'Crear Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
