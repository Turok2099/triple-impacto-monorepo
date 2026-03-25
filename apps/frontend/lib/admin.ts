export interface AdminUser {
  id: string;
  email: string;
  nombre: string;
  apellido?: string;
  telefono?: string;
  dni?: string;
  status: string; // 'ACTIVO', 'INACTIVO (Local)', 'SOFT_DELETE (Bonda)'
  is_active: boolean;
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

export const deleteAffiliation = async (token: string, userId: string, bondaCode: string) => {
  const url = `${API_URL}/admin/users/${userId}/affiliate/${bondaCode}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: getHeaders(token)
  });
  if (!res.ok) throw new Error('Error al desafiliar usuario en Bonda');
  return await res.json();
};
