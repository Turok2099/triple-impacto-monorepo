"use client";

import { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import { getAdminUsers, deleteAdminUser, AdminUser, createAdminUser, updateAdminUser, deleteAffiliation, getUserAdminPayments, toggleUserAdminRole, exportAdminUsersToExcel } from "@/lib/admin";
import { getOrganizaciones } from "@/lib/admin-ongs";
import { useAuth } from "@/contexts/AuthContext";
import { Users, MoreVertical, Edit2, Trash2, UserPlus, X, ShieldAlert, Shield, CheckCircle, XCircle, Receipt, UserSearch, ArrowLeft, Mail, Phone, BookUser, Building2, Image as ImageIcon, Upload, Download } from "lucide-react";
import SeccionAdminOngs from "./SeccionAdminOngs";
import SeccionAdminBanners from "./SeccionAdminBanners";

export default function SeccionAdmin() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<AdminUser | null>(null);
  
  // Filters & Export
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOngFilter, setSelectedOngFilter] = useState("");
  const [bondaStatusFilter, setBondaStatusFilter] = useState("");
  const [ongs, setOngs] = useState<{ id: string; nombre: string }[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({ nombre: "", email: "", telefono: "", dni: "", bondaSlug: "ctfin" });
  const [submitting, setSubmitting] = useState(false);

  // Bulk Upload State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [isUploadingBulk, setIsUploadingBulk] = useState(false);

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem("auth_token") || "";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/bulk-upload-template`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Error al descargar plantilla");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla_usuarios_bonda.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFile) return;
    setIsUploadingBulk(true);
    try {
      const token = localStorage.getItem("auth_token") || "";
      const { bulkUploadUsers } = await import('@/lib/admin-ongs');
      const result = await bulkUploadUsers(token, bulkFile);
      Swal.fire("¡Archivo en Proceso!", result.message, "success");
      setIsBulkModalOpen(false);
      setBulkFile(null);
      fetchUsers();
    } catch (err: any) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setIsUploadingBulk(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchOngs();
  }, [selectedOngFilter, bondaStatusFilter]);

  const fetchOngs = async () => {
    try {
      const token = localStorage.getItem("auth_token") || "";
      const orgs = await getOrganizaciones(token);
      setOngs(orgs);
    } catch (e) {
      console.error("Error fetching ONGs", e);
    }
  };

  const fetchUsers = async (customSearch?: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token") || "";
      const activeSearch = customSearch !== undefined ? customSearch : searchQuery;
      const data = await getAdminUsers(token, 1, 50, activeSearch, selectedOngFilter, bondaStatusFilter); // Fetch up to 50 for now
      setUsers(data.users);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem("auth_token") || "";
      await exportAdminUsersToExcel(token, searchQuery, selectedOngFilter, bondaStatusFilter);
      Swal.fire({
        title: "Éxito",
        text: "Reporte descargado correctamente",
        icon: "success",
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err: any) {
      Swal.fire("Error", "No se pudo generar el reporte: " + err.message, "error");
    } finally {
      setIsExporting(false);
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

  const handleViewPayments = async (user: AdminUser) => {
    try {
      const token = localStorage.getItem("auth_token") || "";
      Swal.fire({
        title: "Cargando pagos...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });
      const payments = await getUserAdminPayments(token, user.id);
      
      if (!payments || payments.length === 0) {
        Swal.fire('Historial', 'Este usuario no tiene pagos registrados.', 'info');
        return;
      }

      const rowsHtml = payments.map((p: any) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: left;">${new Date(p.created_at).toLocaleDateString()}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: left;">${p.organizacion_nombre || 'N/A'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 500;">$${p.amount} ${p.currency}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">
            <span style="font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 99px; background: ${p.status === 'COMPLETED' ? '#dcfce7' : '#fef08a'}; color: ${p.status === 'COMPLETED' ? '#166534' : '#854d0e'};">${p.status}</span>
          </td>
        </tr>
      `).join('');

      Swal.fire({
        title: `<div class="text-xl font-bold text-slate-800 mb-2">Pagos de ${user.nombre}</div>`,
        html: `
          <div style="font-size: 14px; text-align: left; max-height: 400px; overflow-y: auto;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="padding: 10px; border-bottom: 2px solid #cbd5e1; text-align: left; color: #475569; font-size: 12px; text-transform: uppercase;">Fecha</th>
                  <th style="padding: 10px; border-bottom: 2px solid #cbd5e1; text-align: left; color: #475569; font-size: 12px; text-transform: uppercase;">Aporte a</th>
                  <th style="padding: 10px; border-bottom: 2px solid #cbd5e1; text-align: right; color: #475569; font-size: 12px; text-transform: uppercase;">Monto</th>
                  <th style="padding: 10px; border-bottom: 2px solid #cbd5e1; text-align: center; color: #475569; font-size: 12px; text-transform: uppercase;">Estado</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        `,
        width: '650px',
        confirmButtonColor: '#059669',
        confirmButtonText: 'Cerrar'
      });

    } catch (e: any) {
      Swal.fire('Error', e.message, 'error');
    }
  };

  const handleDeleteAffiliate = async (userId: string, bondaCode: string, micrositeId: string) => {
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
      await deleteAffiliation(token, userId, bondaCode, micrositeId);
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

  const handleToggleRole = async (userToToggle: AdminUser) => {
    const isCurrentlyAdmin = userToToggle.role === 'admin';
    const newRole = isCurrentlyAdmin ? 'user' : 'admin';
    
    if (userToToggle.id === user?.id) {
      Swal.fire('Acción no permitida', 'No puedes alterar tus propios accesos.', 'warning');
      return;
    }
    
    const result = await Swal.fire({
      title: isCurrentlyAdmin ? '¿Revocar privilegios?' : '¿Hacer Administrador?',
      text: isCurrentlyAdmin 
        ? `¿Seguro que deseas quitar el acceso de administrador a ${userToToggle.nombre}?` 
        : `¿Seguro que deseas otorgar privilegios de administrador a ${userToToggle.nombre}? Podrá acceder a este panel.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: isCurrentlyAdmin ? '#ef4444' : '#059669',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: isCurrentlyAdmin ? 'Sí, revocar' : 'Sí, hacer administrador',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("auth_token") || "";
      await toggleUserAdminRole(token, userToToggle.id, newRole);
      Swal.fire({
        title: '¡Roles Actualizados!',
        text: `El usuario ahora tiene el rol: ${newRole}.`,
        icon: 'success',
        confirmButtonColor: '#059669'
      });
      fetchUsers();
    } catch (err: any) {
      Swal.fire({
        title: 'Error',
        text: "Error actualizando rol: " + err.message,
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

  const [adminTab, setAdminTab] = useState<"usuarios" | "ongs" | "banners">("ongs"); // Default to ONGs as it's the new feature

  if (selectedUserForDetails) {
    const u = selectedUserForDetails;
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <button 
          onClick={() => setSelectedUserForDetails(null)}
          className="mb-8 flex items-center gap-2 text-slate-500 hover:text-[#2c8184] transition-colors font-medium border border-transparent hover:border-[#2c8184]/20 px-3 py-1.5 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver al panel principal
        </button>

        {/* ... user details code remains unchanged ... */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-8">
          <div className="flex items-center gap-5 mb-8 pb-8 border-b border-slate-100">
             <div className="size-20 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-3xl">
                {u.nombre.charAt(0).toUpperCase()}
             </div>
             <div>
                <h1 className="text-3xl font-bold text-slate-900">{u.nombre}</h1>
                <p className="text-slate-500 flex items-center gap-2 mt-1">
                  Rol: {u.role === 'admin' ? 'Administrador' : 'Usuario'} 
                  {u.role === 'admin' ? <Shield className="w-4 h-4 text-purple-600 fill-purple-600" /> : null}
                </p>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2">Información de Contacto</h3>
              
              <div className="flex gap-4">
                <div className="mt-1 bg-slate-50 p-2 rounded-lg text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Correo Electrónico</p>
                  <p className="text-slate-900 font-medium">{u.email}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 bg-slate-50 p-2 rounded-lg text-slate-400">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Teléfono</p>
                  <p className="text-slate-900 font-medium">{u.telefono || 'Sin teléfono'}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 bg-slate-50 p-2 rounded-lg text-slate-400">
                  <UserSearch className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">DNI</p>
                  <p className="text-slate-900 font-medium">{u.dni || 'Sin registrar'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2">Estado y Afiliaciones</h3>
              
              <div className="flex gap-4 items-center">
                <div className="bg-slate-50 p-2 rounded-lg text-slate-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                 <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Estado de la cuenta local</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    u.status === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {u.status}
                  </span>
                </div>
              </div>

              <div>
                 <p className="text-sm font-medium text-slate-500 mb-3">Afiliaciones en plataforma Bonda</p>
                 {(u.usuarios_bonda_afiliados || []).length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {(u.usuarios_bonda_afiliados || []).map((aff, i) => (
                        <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${aff.is_active ? 'bg-slate-50 border-slate-200' : 'bg-red-50/50 border-red-100'}`}>
                          <div className="flex items-center gap-3">
                            {aff.is_active ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-400" />}
                            <div>
                              <p className={`font-medium ${aff.is_active ? 'text-slate-700' : 'text-slate-500 line-through'}`}>{aff.ong_name || 'Afiliación'}</p>
                              <p className="text-xs text-slate-400">Cód: {aff.affiliate_code}</p>
                            </div>
                          </div>
                          {aff.is_active && (
                            <button 
                              onClick={() => {
                                handleDeleteAffiliate(u.id, aff.affiliate_code, aff.bonda_microsite_id);
                                setSelectedUserForDetails(null);
                              }}
                              className="text-xs text-red-500 hover:text-white hover:bg-red-500 border border-red-200 rounded px-3 py-1.5 transition-all"
                            >
                              Desvincular
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                 ) : (
                    <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center">
                      <span className="text-slate-400 text-sm">Sin afiliaciones registradas</span>
                    </div>
                 )}
              </div>
            </div>
            
            <div className="col-span-1 md:col-span-2 mt-4 pt-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedUserForDetails(null);
                  handleViewPayments(u);
                }}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors font-medium"
              >
                <Receipt className="w-5 h-5" />
                Ver Historial de Pagos
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-[#2c8184]" />
            Panel de Súper Administrador
          </h1>
          <p className="text-slate-500 mt-2">Gestiona usuarios, ONGs y accesos al sistema.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8 border-b border-slate-200">
        <button
          onClick={() => setAdminTab("ongs")}
          className={`pb-4 px-2 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            adminTab === "ongs" ? "border-[#2c8184] text-[#2c8184]" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Fundaciones / ONGs
        </button>
        <button
          onClick={() => setAdminTab("usuarios")}
          className={`pb-4 px-2 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            adminTab === "usuarios" ? "border-[#2c8184] text-[#2c8184]" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Users className="w-4 h-4" />
          Usuarios Registrados
        </button>
        <button
          onClick={() => setAdminTab("banners")}
          className={`pb-4 px-2 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            adminTab === "banners" ? "border-[#2c8184] text-[#2c8184]" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Banners Home
        </button>
      </div>

      <div className="min-h-[600px]">
        {adminTab === "ongs" ? (
        <SeccionAdminOngs />
      ) : adminTab === "banners" ? (
        <SeccionAdminBanners />
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <form onSubmit={handleSearchSubmit} className="flex-1 w-full md:max-w-md flex items-center gap-2 relative">
              <UserSearch className="w-5 h-5 absolute left-3 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o DNI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#2c8184] focus:border-[#2c8184] outline-none transition-all text-sm"
              />
              <button type="submit" className="hidden" />
            </form>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={selectedOngFilter}
                onChange={(e) => setSelectedOngFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 focus:ring-2 focus:ring-[#2c8184] outline-none bg-slate-50 cursor-pointer"
              >
                <option value="">Todas las ONGs</option>
                {ongs.map(ong => (
                  <option key={ong.id} value={ong.id}>{ong.nombre}</option>
                ))}
              </select>

              <select
                value={bondaStatusFilter}
                onChange={(e) => setBondaStatusFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 focus:ring-2 focus:ring-[#2c8184] outline-none bg-slate-50 cursor-pointer"
              >
                <option value="">Cualquier estado</option>
                <option value="activo">Bonda Activo</option>
                <option value="inactivo">Bonda Inactivo</option>
              </select>

              <button
                onClick={handleExportExcel}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold transition-all shadow-sm text-sm disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exportando...' : 'Exportar'}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 mb-4">
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl font-semibold transition-all shadow-sm text-sm"
            >
              <Users className="w-4 h-4" />
              Carga Masiva (Bonda)
            </button>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-6 py-3 bg-[#2c8184] hover:bg-[#1e6063] text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg text-sm"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo Usuario
            </button>
          </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2c8184]"></div>
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
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Registro</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Afiliación Bonda</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Aportes</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center flex-shrink-0">
                          {u.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <p className="font-semibold text-slate-900 flex items-center gap-2 truncate">
                            {u.nombre}
                            {u.role === 'admin' && (
                              <span title="Administrador" className="flex items-center flex-shrink-0">
                                <Shield className="w-3.5 h-3.5 text-purple-600 fill-purple-600" />
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 truncate" title={u.email}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-slate-700">
                          {new Date(u.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-slate-500">DNI: {u.dni || 'N/A'}</span>
                      </div>
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
                                  onClick={() => handleDeleteAffiliate(u.id, aff.affiliate_code, aff.bonda_microsite_id)}
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
                    <td className="py-4 px-6">
                      {(() => {
                        const donaciones = u.donaciones || [];
                        const completed = donaciones.filter((d: any) => d.estado === 'COMPLETED');
                        if (completed.length === 0) {
                          return <span className="text-xs text-slate-400 italic">Sin aportes</span>;
                        }
                        const last = completed.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                        return (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-emerald-600">${last.monto} {last.moneda}</span>
                            <span className="text-[10px] text-slate-500">{new Date(last.created_at).toLocaleDateString()}</span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        {user?.role === 'admin' && u.id !== user?.id && (
                           <button
                             onClick={() => handleToggleRole(u)}
                             className={`p-2 rounded-lg transition-colors ${
                               u.role === 'admin' 
                                 ? 'text-purple-600 hover:bg-purple-50' 
                                 : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'
                             }`}
                             title={u.role === 'admin' ? "Revocar Admin" : "Hacer Admin"}
                           >
                             <Shield className="w-4 h-4" />
                           </button>
                        )}
                        <button
                          onClick={() => handleViewPayments(u)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver historial de pagos"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-2 text-slate-400 hover:text-[#2c8184] hover:bg-emerald-50 rounded-lg transition-colors"
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
                        <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                           DNI 
                           {editingUser && <span className="text-[10px] font-normal text-slate-400 font-mono">(Solo lectura)</span>}
                        </label>
                        <input 
                          required 
                          value={formData.dni} 
                          onChange={e => setFormData({...formData, dni: e.target.value})} 
                          disabled={!!editingUser}
                          className={`w-full px-4 py-2.5 rounded-xl border transition-all outline-none ${
                            editingUser
                              ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed border-dashed'
                              : 'bg-white border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                          }`} 
                        />
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
                    <button type="submit" disabled={submitting} className="flex-1 py-3 px-4 bg-[#2c8184] hover:bg-[#1e6063] disabled:bg-emerald-400 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 transition-all flex justify-center items-center">
                      {submitting ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Guardar Cambios'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Carga Masiva */}
          {isBulkModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 my-auto">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-600" />
                    Carga Masiva de Usuarios
                  </h2>
                  <button onClick={() => setIsBulkModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h3 className="font-semibold text-blue-900 mb-2">Paso 1: Descarga la plantilla</h3>
                    <p className="text-sm text-blue-700 mb-3">La plantilla incluye la lista actualizada de ONGs activas en el sistema para que las selecciones fácilmente en el archivo.</p>
                    <button type="button" onClick={handleDownloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold transition-colors">
                      <Download className="w-4 h-4" /> Descargar Plantilla Excel
                    </button>
                  </div>

                  <form onSubmit={handleBulkSubmit}>
                    <h3 className="font-semibold text-slate-800 mb-2">Paso 2: Sube el archivo completado</h3>
                    <label className="flex flex-col items-center justify-center w-full h-32 px-4 py-3 bg-white border-2 border-dashed border-emerald-200 rounded-xl cursor-pointer hover:bg-emerald-50 hover:border-emerald-400 transition-colors mb-6">
                       <div className="flex flex-col items-center justify-center gap-2 text-emerald-600 font-medium">
                         <Upload className="w-6 h-6" />
                         <span className="text-sm">{bulkFile ? bulkFile.name : 'Seleccionar archivo .xlsx'}</span>
                       </div>
                       <input required type="file" accept=".xlsx" className="hidden" onChange={(e) => setBulkFile(e.target.files?.[0] || null)} />
                    </label>

                    <div className="flex gap-3">
                      <button type="button" onClick={() => setIsBulkModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold rounded-xl transition-colors">Cancelar</button>
                      <button type="submit" disabled={!bulkFile || isUploadingBulk} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold rounded-xl transition-colors flex justify-center items-center">
                        {isUploadingBulk ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Procesar Archivo'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </>
        )}
      </div>
    </div>
  );
}
