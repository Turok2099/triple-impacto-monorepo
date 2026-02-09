/**
 * DTO para la tabla public_coupons_v2 en Supabase
 * Representa un cupón público sincronizado desde Bonda
 */
export class PublicCouponV2Dto {
  id: string;
  bonda_cupon_id: string;
  bonda_microsite_id?: string;
  
  // Información básica
  nombre: string;
  descuento?: string;
  descripcion_breve?: string;
  
  // Empresa
  empresa_nombre?: string;
  empresa_id?: string;
  empresa_logo_url?: string;
  empresa_data?: {
    id: string;
    nombre: string;
    logo_thumbnail?: {
      original?: string;
      '90x90'?: string;
    };
    descripcion?: string;
  };
  
  // Imágenes
  imagen_principal_url?: string;
  imagen_thumbnail_url?: string;
  imagenes?: {
    principal?: {
      original?: string;
      '280x190'?: string;
    };
    thumbnail?: {
      original?: string;
      '90x90'?: string;
    };
    apaisada?: {
      '240x80'?: string;
    };
  };
  
  // Contenido HTML
  descripcion_micrositio?: string;
  usage_instructions?: string;
  legales?: string;
  
  // Categorización
  categorias?: Array<{
    id: number;
    nombre: string;
    parent_id?: string;
  }>;
  categoria_principal?: string;
  
  // Validez y uso
  fecha_vencimiento?: string;
  activo: boolean;
  usar_en?: {
    email?: boolean;
    phone?: boolean;
    online?: boolean;
    onsite?: boolean;
    whatsapp?: boolean;
  };
  permitir_sms?: boolean;
  
  // Metadata
  orden?: number;
  created_at?: string;
  updated_at?: string;
  synced_at?: string;
}

/**
 * DTO simplificado para insertar/actualizar cupones en public_coupons_v2
 */
export interface InsertPublicCouponV2 {
  bonda_cupon_id: string;
  bonda_microsite_id?: string;
  nombre: string;
  descuento?: string;
  descripcion_breve?: string;
  empresa_nombre?: string;
  empresa_id?: string;
  empresa_logo_url?: string;
  empresa_data?: object;
  imagen_principal_url?: string;
  imagen_thumbnail_url?: string;
  imagenes?: object;
  descripcion_micrositio?: string;
  usage_instructions?: string;
  legales?: string;
  categorias?: object;
  categoria_principal?: string;
  fecha_vencimiento?: string;
  activo?: boolean;
  usar_en?: object;
  permitir_sms?: boolean;
  orden?: number;
}
