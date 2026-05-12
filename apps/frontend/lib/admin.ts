export interface AdminUser {
  id: string;
  email: string;
  nombre: string;
  apellido?: string;
  telefono?: string;
  dni?: string;
  status: string; // 'ACTIVO', 'INACTIVO (Local)', 'SOFT_DELETE (Bonda)'
  is_active: boolean;
  role?: string;
  usuarios_bonda_afiliados?: { affiliate_code: string; bonda_microsite_id: string; ong_name?: string; is_active?: boolean; }[];
  created_at: string;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const getHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const getAdminUsers = async (token: string, page = 1, limit = 20): Promise<AdminUsersResponse> => {
  const url = `${API_URL}/admin/users?page=${page}&limit=${limit}`;
  const res = await fetch(url, { headers: getHeaders(token) });
  if (!res.ok) throw new Error('Error recuperando usuarios. Status: ' + res.status);
  return await res.json();
};

export const createAdminUser = async (token: string, payload: any) => {
  const url = `${API_URL}/admin/users`;
  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || 'Error creando usuario');
  }
  return await res.json();
};

export const updateAdminUser = async (token: string, id: string, payload: any) => {
  const url = `${API_URL}/admin/users/${id}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || 'Error actualizando usuario');
  }
  return await res.json();
};

export const toggleUserAdminRole = async (token: string, id: string, newRole: string) => {
  const url = `${API_URL}/admin/users/${id}/role`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ role: newRole })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || 'Error actualizando rol de usuario');
  }
  return await res.json();
};

export const deleteAdminUser = async (token: string, id: string) => {
  const url = `${API_URL}/admin/users/${id}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: getHeaders(token)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || 'Error eliminando usuario');
  }
  return await res.json();
};

export const deleteAffiliation = async (token: string, userId: string, bondaCode: string, micrositeId: string) => {
  const url = `${API_URL}/admin/users/${userId}/affiliate/${bondaCode}/microsite/${micrositeId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: getHeaders(token)
  });
  if (!res.ok) throw new Error('Error al desafiliar usuario en Bonda');
  return await res.json();
};

export const getUserAdminPayments = async (token: string, userId: string) => {
  const url = `${API_URL}/admin/users/${userId}/payments`;
  const res = await fetch(url, { headers: getHeaders(token) });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || 'Error recuperando historial de pagos');
  }
  return await res.json();
};

// ==========================================
// BANNERS
// ==========================================

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url?: string;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export const getAdminBanners = async (token: string): Promise<Banner[]> => {
  const url = `${API_URL}/admin/banners`;
  const res = await fetch(url, { headers: getHeaders(token) });
  if (!res.ok) throw new Error('Error recuperando banners');
  return await res.json();
};

export const uploadBannerImage = async (token: string, file: File) => {
  const url = `${API_URL}/admin/banners/upload`;
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
      // 'Content-Type': 'multipart/form-data' is handled by the browser
    },
    body: formData
  });
  if (!res.ok) throw new Error('Error subiendo imagen de banner');
  return await res.json();
};

export const createBanner = async (token: string, payload: Partial<Banner>) => {
  const url = `${API_URL}/admin/banners`;
  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error creando banner');
  return await res.json();
};

export const updateBanner = async (token: string, id: string, payload: Partial<Banner>) => {
  const url = `${API_URL}/admin/banners/${id}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error actualizando banner');
  return await res.json();
};

export const deleteBanner = async (token: string, id: string) => {
  const url = `${API_URL}/admin/banners/${id}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: getHeaders(token)
  });
  if (!res.ok) throw new Error('Error eliminando banner');
  return await res.json();
};
