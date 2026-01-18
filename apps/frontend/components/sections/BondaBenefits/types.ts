// Tipos para el componente de Beneficios de Bonda

export type Category = "todos" | "salud" | "bienestar" | "servicios" | "gastronomia" | "educacion";

export interface Benefit {
  id: number;
  title: string;
  category: Category;
  discount: number;
  description: string;
  conditions: string;
  logo: string; // URL de la imagen o emoji
  popular: boolean;
  // Campos opcionales para extender desde la API
  expiryDate?: string;
  minDonation?: number;
  maxUses?: number;
  partnerId?: string;
  partnerName?: string;
}

export interface CategoryFilter {
  id: Category;
  label: string;
  icon: string;
}

export interface BenefitsResponse {
  benefits: Benefit[];
  total: number;
  page: number;
  perPage: number;
}


