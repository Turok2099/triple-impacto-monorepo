"use client";

import { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import { getAdminUsers, deleteAdminUser, AdminUser, createAdminUser, updateAdminUser, deleteAffiliation } from "@/lib/admin";
import { useAuth } from "@/contexts/AuthContext";
import { Users, MoreVertical, Edit2, Trash2, UserPlus, X, ShieldAlert, CheckCircle, XCircle } from "lucide-react";

export default function SeccionAdmin() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({ nombre: "", email: "", telefono: "", dni: "", bondaSlug: "ctfin" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token") || "";
      const data = await getAdminUsers(token, 1, 50); // Fetch up to 50 for now
      setUsers(data.users);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: '¿Dar de baja usuario?',
      text: `¿Seguro que deseas dar de baja a ${name}? Esto hará un soft-delete de 30 días en Bonda para TODAS sus afiliaciones y en nuestro sistema local.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444', // Tailwind red-500
      cancelButtonColor: '#94a3b8', // Tailwind slate-400
      confirmButtonText: 'Sí, dar de baja',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("auth_token") || "";
      await deleteAdminUser(token, id);
      Swal.fire({
        title: '¡Baja Exitosa!',
        text: 'El usuario ha sido desactivado en el sistema.',
        icon: 'success',
        confirmButtonColor: '#059669' // Tailwind emerald-600
      });
      fetchUsers();
    } catch (err: any) {
      Swal.fire({
        title: 'Error',
        text: "Error eliminando: " + err.message,
        icon: 'error',
        confirmButtonColor: '#059669'
      });
    }
  };

  const handleDeleteAffiliate = async (userId: string, bondaCode: string) => {
    const result = await Swal.fire({
      title: '¿Desvincular Afiliación?',
      text: `¿Seguro que deseas dar de baja la afiliación ${bondaCode}? Perderá sus beneficios en esta ONG por 30 días.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Sí, desvincular',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("auth_token") || "";
      await deleteAffiliation(token, userId, bondaCode);
      Swal.fire({
        title: '¡Desvinculado!',
        text: `La afiliación ${bondaCode} fue cancelada exitosamente.`,
        icon: 'success',
        confirmButtonColor: '#059669'
      });
      fetchUsers();
    } catch (err: any) {
      Swal.fire({
        title: 'Error',
        text: "Error eliminando afiliación: " + err.message,
        icon: 'error',
        confirmButtonColor: '#059669'
      });
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ nombre: "", email: "", telefono: "", dni: "", bondaSlug: "ctfin" });
    setIsModalOpen(true);
  };

  const openEditModal = (u: AdminUser) => {
    setEditingUser(u);
    setFormData({ nombre: u.nombre, email: u.email, telefono: u.telefono || "", dni: u.dni || "", bondaSlug: "ctfin" });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token") || "";
      if (editingUser) {
        await updateAdminUser(token, editingUser.id, formData);
        Swal.fire('¡Actualizado!', 'El usuario fue modificado con éxito.', 'success');
      } else {
        const res = await createAdminUser(token, formData);
        if (res.isRestored) {
          Swal.fire('¡Registrado!', 'El usuario ya existía en estado Soft-Delete en Bonda y ha sido restaurado exitosamente.', 'info');
        } else {
          Swal.fire('¡Registrado!', 'El usuario fue creado con éxito.', 'success');
        }
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-emerald-600" />
            Panel de Súper Administrador
          </h1>
          <p className="text-slate-500 mt-2">Gestiona {total} usuarios y su estado de sincronización con Bonda.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="mt-4 md:mt-0 flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
        >
          <UserPlus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 flex items-center gap-3">
          <ShieldAlert className="w-6 h-6" />
          <span>Error cargando usuarios: {error}</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuario</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contacto</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Afiliación Bonda</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center">
                          {u.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{u.nombre}</p>
                          <p className="text-xs text-slate-500">DNI: {u.dni || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-slate-700">{u.email}</p>
                      <p className="text-xs text-slate-400">{u.telefono || 'Sin teléfono'}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        u.status === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 min-w-[250px]">
                      {(u.usuarios_bonda_afiliados || []).length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {(u.usuarios_bonda_afiliados || []).map((aff, i) => (
                            <span key={i} className={`group relative flex items-center justify-between text-xs px-2.5 py-1.5 rounded-md border transition-all ${aff.is_active ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 shadow-sm' : 'bg-red-50/50 border-red-100 text-slate-500 opacity-80'}`}>
                              <span className="flex items-center gap-2" title={`Cód: ${aff.affiliate_code}`}>
                                {aff.is_active ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                                <div className="flex flex-col">
                                  <span className={`font-medium ${aff.is_active ? 'text-slate-700' : 'text-slate-500 line-through'}`}>{aff.ong_name || aff.affiliate_code}</span>
                                  <span className="text-[10px] text-slate-400">ID: {aff.affiliate_code}</span>
                                </div>
                              </span>
                              {aff.is_active && (
                                <button 
                                  onClick={() => handleDeleteAffiliate(u.id, aff.affiliate_code)}
                                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white hover:bg-red-500 rounded p-1 transition-all ml-2"
                                  title="Desvincular afiliación"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Sin afiliación</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Editar usuario"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {u.status === 'ACTIVO' && (
                          <button
                            onClick={() => handleDelete(u.id, u.nombre)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Dar de baja (Soft Delete)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Creación/Edición */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">
                {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre Completo</label>
                  <input required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">DNI</label>
                    <input required value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Teléfono</label>
                    <input value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                  </div>
                </div>
                {!editingUser && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Organización / Slug Bonda</label>
                    <input value={formData.bondaSlug} onChange={e => setFormData({...formData, bondaSlug: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                    <p className="text-[11px] text-slate-400 mt-1">Por defecto: "ctfin"</p>
                  </div>
                )}
              </div>
              
              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 transition-all flex justify-center items-center">
                  {submitting ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
