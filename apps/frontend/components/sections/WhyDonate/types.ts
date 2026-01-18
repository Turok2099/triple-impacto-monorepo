// Tipos para el componente WhyDonate

export interface Partner {
  id: number;
  name: string;
  logo: string; // URL de imagen o emoji
  description: string;
  beneficiaries: number;
  website?: string;
  certified?: boolean;
  activeProjects?: number;
}

export interface ImpactStat {
  icon: string;
  value: string;
  label: string;
  description: string;
  trend?: "up" | "down" | "stable";
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  avatar: string; // URL de imagen o emoji
  text: string;
  rating: number;
  date?: string;
  location?: string;
}

export interface ImpactArea {
  icon: string;
  title: string;
  description: string;
  projectsCount?: number;
  beneficiaries?: number;
}

export interface TrustBadge {
  id: string;
  label: string;
  icon: string;
  verified: boolean;
}


