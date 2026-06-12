export interface BondaMicrosite {
  id: string;
  slug: string;
  nombre: string;
  api_token: string;
  api_token_nominas: string | null;
  microsite_id: string | null;
  organizacion_id: string;
  activo: boolean;
}

export interface Ong {
  id: string;
  nombre: string;
  descripcion: string;
  logo_url: string | null;
  website_url: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  monto_minimo: number | null;
  activa: boolean;
  verificada: boolean;
  fiserv_activo: boolean;
  fiserv_store_id: string | null;
  fiserv_shared_secret: string | null;
  slug: string | null;
  bonda_microsites?: BondaMicrosite[];
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getOrganizaciones(token: string): Promise<Ong[]> {
  const res = await fetch(`${API_URL}/admin/organizaciones`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error fetching organizaciones');
  }
  return res.json();
}

export async function createOrganizacion(token: string, data: any): Promise<Ong> {
  const res = await fetch(`${API_URL}/admin/organizaciones`, {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error creating ONG');
  }
  return res.json();
}

export async function updateOrganizacion(token: string, id: string, data: any): Promise<Ong> {
  const res = await fetch(`${API_URL}/admin/organizaciones/${id}`, {
    method: 'PATCH',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error updating ONG');
  }
  return res.json();
}

export async function uploadLogo(token: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/admin/organizaciones/upload-logo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error uploading logo');
  }

  const data = await res.json();
  return data.url;
}

export async function deleteOrganizacion(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/organizaciones/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error deleting ONG');
  }
}

export async function permanentDeleteOrganizacion(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/organizaciones/${id}/permanent`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error permanently deleting ONG');
  }
}

export async function bulkUploadUsers(token: string, file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/admin/users/bulk-upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error uploading users file');
  }

  return res.json();
}
