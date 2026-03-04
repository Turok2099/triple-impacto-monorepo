/**
 * Logos de organizaciones desde Cloudinary.
 * Un solo lugar de verdad: agregar o editar entradas aquí (o más adelante cargar desde JSON/API).
 */

export interface OrganizationLogo {
  nombre: string;
  url: string;
}

export const ORGANIZATION_LOGOS: OrganizationLogo[] = [
  {
    nombre: "BIBLIOTECAS ARGENTINAS ARGENTINA",
    url: "https://res.cloudinary.com/dxbtafe9u/image/upload/v1772639409/BIBLIOTECAS_ARGENTINAS_ARGENTINA_z7pwqf.jpg",
  },
  {
    nombre: "FUNDACIÓN PADRES",
    url: "https://res.cloudinary.com/dxbtafe9u/image/upload/v1772639406/FUNDACION_PADRES_tb3k8x.jpg",
  },
  {
    nombre: "HACIENDO CAMINO",
    url: "https://res.cloudinary.com/dxbtafe9u/image/upload/v1772639405/HACIENDO_CAMINO_zhc1h2.jpg",
  },
  {
    nombre: "LA GUARIDA",
    url: "https://res.cloudinary.com/dxbtafe9u/image/upload/v1772639409/LA_GUARIDA_d3e6ef.jpg",
  },
  {
    nombre: "LOROS PARLANTES",
    url: "https://res.cloudinary.com/dxbtafe9u/image/upload/v1772639407/LOROS_PARLANTES_jeasel.jpg",
  },
  {
    nombre: "MAMIS SOLIDARIAS",
    url: "https://res.cloudinary.com/dxbtafe9u/image/upload/v1772639411/MAMIS_SOLIDARIAS_pivhy7.jpg",
  },
  {
    nombre: "MONTE ADENTRO",
    url: "https://res.cloudinary.com/dxbtafe9u/image/upload/v1772639412/MONTE_ADENTRO_t82dgj.jpg",
  },
  {
    nombre: "PLATO LLENO",
    url: "https://res.cloudinary.com/dxbtafe9u/image/upload/v1772639413/PLATO_LLENO_gili2h.jpg",
  },
  {
    nombre: "PROACTIVA",
    url: "https://res.cloudinary.com/dxbtafe9u/image/upload/v1772639406/PROACTIVA_gi0znh.jpg",
  },
  {
    nombre: "PROYECTARR",
    url: "https://res.cloudinary.com/dxbtafe9u/image/upload/v1772639410/PROYECTARR_fkylyp.jpg",
  },
  {
    nombre: "REGENERAR",
    url: "https://res.cloudinary.com/dxbtafe9u/image/upload/v1772639407/REGENERAR_ed9cmx.jpg",
  },
  {
    nombre: "TECHO ARGENTINA",
    url: "https://res.cloudinary.com/dxbtafe9u/image/upload/v1772639408/TECHO_ARGENTINA_urgeac.jpg",
  },
];

/** Normaliza nombre para búsqueda: mayúsculas, sin acentos, trim. */
function normalizeName(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/\u0300-\u036f/g, "");
}

/** Alias: nombre que puede devolver la API -> nombre clave en nuestra lista. */
const ALIASES: Record<string, string> = {
  "BIBLIOTECA POPULAR RURALES ARGENTINAS": "BIBLIOTECAS ARGENTINAS ARGENTINA",
  "BIBLIOTECAS RURALES ARGENTINAS": "BIBLIOTECAS ARGENTINAS ARGENTINA",
  "FUNDACION PADRES": "FUNDACIÓN PADRES",
  "PROYECTAR": "PROYECTARR",
  "TECHO": "TECHO ARGENTINA",
};

/** Map: nombre normalizado -> URL (construido una vez). */
const LOGO_MAP: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const entry of ORGANIZATION_LOGOS) {
    map.set(normalizeName(entry.nombre), entry.url);
  }
  return map;
})();

/** Prefijos típicos en slugs de micrositios que no forman parte del nombre de la org. */
const SLUG_PREFIXES = ["club", "beneficios", "comunidad"];

/**
 * Convierte un slug (ej. "club-plato-lleno") en posibles nombres de búsqueda.
 * Devuelve ["CLUB PLATO LLENO", "PLATO LLENO"] para probar match.
 */
function slugToSearchKeys(slug: string): string[] {
  if (!slug) return [];
  const parts = slug.split("-").filter(Boolean);
  const full = parts
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(" ");
  const keys = [normalizeName(full)];
  const withoutPrefix = parts.filter(
    (p) => !SLUG_PREFIXES.includes(p.toLowerCase())
  );
  if (withoutPrefix.length > 0 && withoutPrefix.length < parts.length) {
    const short = withoutPrefix
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
      .join(" ");
    keys.push(normalizeName(short));
  }
  return keys;
}

/**
 * Devuelve la URL del logo de Cloudinary para una organización, o null si no hay match.
 * Usa nombre (y opcionalmente slug) para hacer el match contra la lista.
 */
export function getOrganizationLogoUrl(
  nombre: string,
  slug?: string
): string | null {
  if (!nombre && !slug) return null;

  const normalizedNombre = normalizeName(nombre);
  const byAlias = ALIASES[normalizedNombre];
  const key = byAlias ? normalizeName(byAlias) : normalizedNombre;

  let url = LOGO_MAP.get(key);
  if (url) return url;

  if (slug) {
    for (const searchKey of slugToSearchKeys(slug)) {
      url = LOGO_MAP.get(searchKey);
      if (url) return url;
    }
  }

  return null;
}
