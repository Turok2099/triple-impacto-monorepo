import { Partner } from "@/components/sections/WhyDonate/types";

// Datos de ONGs aliadas basados en organizations.ts (16 ONGs)
export const partnersData: Partner[] = [
  {
    id: 1,
    name: "VOY EN BICI",
    logo: "🚴",
    description:
      "Promoción de la movilidad sustentable y educación vial en comunidades urbanas para un transporte más limpio y saludable.",
    beneficiaries: 380,
    website: "https://www.voyenbici.org.ar",
    certified: true,
    activeProjects: 8,
  },
  {
    id: 2,
    name: "PROYECTAR ONG",
    logo: "🎯",
    description:
      "Desarrollo de proyectos sociales enfocados en educación, capacitación laboral y emprendedurismo social.",
    beneficiaries: 720,
    website: "https://www.proyectar.org.ar",
    certified: true,
    activeProjects: 14,
  },
  {
    id: 3,
    name: "MAMIS SOLIDARIAS",
    logo: "🤱",
    description:
      "Apoyo a madres en situación de vulnerabilidad con asistencia alimentaria, capacitación y acompañamiento.",
    beneficiaries: 550,
    website: "https://www.mamissolidarias.org",
    certified: true,
    activeProjects: 7,
  },
  {
    id: 4,
    name: "BIBLIOTECAS RURALES ARGENTINAS",
    logo: "📚",
    description:
      "Promoción de la lectura y acceso a la educación en comunidades rurales a través de bibliotecas populares.",
    beneficiaries: 450,
    website: "https://www.bibliotecasrurales.org.ar",
    certified: true,
    activeProjects: 25,
  },
  {
    id: 5,
    name: "ASOCIACIÓN ALTAS CAPACIDADES ARGENTINA",
    logo: "🧠",
    description:
      "Acompañamiento y apoyo a niños, niñas y adolescentes con altas capacidades intelectuales y sus familias.",
    beneficiaries: 280,
    website: "https://www.altascapacidades.org.ar",
    certified: true,
    activeProjects: 5,
  },
  {
    id: 6,
    name: "LA GUARDIA ONG",
    logo: "https://res.cloudinary.com/dxbtafe9u/image/upload/v1768407416/LOGO_C3I_ONG_LA_GUARIDA_FONDO_TRANSPARENTE_pzuhqq.png",
    description:
      "Protección de derechos de niños, niñas y adolescentes en situación de vulnerabilidad social.",
    beneficiaries: 490,
    website: "https://www.laguardia.org.ar",
    certified: true,
    activeProjects: 9,
  },
  {
    id: 7,
    name: "PLATO LLENO",
    logo: "🍽️",
    description:
      "Lucha contra el hambre a través de la distribución de alimentos y comedores comunitarios en zonas vulnerables.",
    beneficiaries: 1200,
    website: "https://www.platolleno.org",
    certified: true,
    activeProjects: 15,
  },
  {
    id: 8,
    name: "MONTE ADENTRO",
    logo: "🌲",
    description:
      "Conservación de bosques nativos y promoción del desarrollo sustentable en comunidades rurales.",
    beneficiaries: 320,
    website: "https://www.monteadentro.org.ar",
    certified: true,
    activeProjects: 6,
  },
  {
    id: 9,
    name: "SUSTENTABILIDAD SIN FRONTERAS",
    logo: "🌍",
    description:
      "Promoción de prácticas sustentables y educación ambiental para un futuro más verde y consciente.",
    beneficiaries: 340,
    website: "https://www.sustentabilidadsinfronteras.org",
    certified: true,
    activeProjects: 6,
  },
  {
    id: 10,
    name: "PROACTIVA",
    logo: "⚡",
    description:
      "Impulso al desarrollo comunitario mediante proyectos de innovación social y participación ciudadana.",
    beneficiaries: 410,
    website: "https://www.proactiva.org.ar",
    certified: true,
    activeProjects: 11,
  },
  {
    id: 11,
    name: "FUNDACIÓN PADRES",
    logo: "👨‍👩‍👧‍👦",
    description:
      "Acompañamiento y apoyo a familias en situación de vulnerabilidad, fortaleciendo los vínculos familiares y comunitarios.",
    beneficiaries: 620,
    website: "https://www.fundacionpadres.org",
    certified: true,
    activeProjects: 8,
  },
  {
    id: 12,
    name: "FUNDACIÓN REGENERAR",
    logo: "🌱",
    description:
      "Preservación del medio ambiente y desarrollo sustentable a través de proyectos de regeneración ecológica.",
    beneficiaries: 380,
    website: "https://www.regenerar.org.ar",
    certified: true,
    activeProjects: 10,
  },
  {
    id: 13,
    name: "HACIENDO CAMINO",
    logo: "🛤️",
    description:
      "Inclusión social y laboral de personas en situación de vulnerabilidad a través de capacitación y acompañamiento.",
    beneficiaries: 530,
    website: "https://www.haciendocamino.org.ar",
    certified: true,
    activeProjects: 9,
  },
  {
    id: 14,
    name: "TECHO",
    logo: "🏠",
    description:
      "Construcción de viviendas de emergencia y desarrollo comunitario en asentamientos populares de toda América Latina.",
    beneficiaries: 850,
    website: "https://www.techo.org",
    certified: true,
    activeProjects: 12,
  },
  {
    id: 15,
    name: "LOROS PARLANTES",
    logo: "🦜",
    description:
      "Fomento de la lectura y expresión artística en niños y jóvenes a través de talleres creativos y literarios.",
    beneficiaries: 290,
    website: "https://www.lorosparlantes.org.ar",
    certified: true,
    activeProjects: 7,
  },
  {
    id: 16,
    name: "ALDEA DE LUCES",
    logo: "✨",
    description:
      "Contención y apoyo integral a niños, niñas y adolescentes en situación de vulnerabilidad emocional y social.",
    beneficiaries: 360,
    website: "https://www.aldeadeluces.org.ar",
    certified: true,
    activeProjects: 8,
  },
];

// Función para obtener todas las organizaciones
export const getAllPartners = (): Partner[] => {
  return partnersData;
};

// Función para obtener una organización por ID
export const getPartnerById = (id: number): Partner | undefined => {
  return partnersData.find((partner) => partner.id === id);
};

// Función para obtener organizaciones destacadas (las primeras 6)
export const getFeaturedPartners = (limit: number = 6): Partner[] => {
  return partnersData.slice(0, limit);
};
