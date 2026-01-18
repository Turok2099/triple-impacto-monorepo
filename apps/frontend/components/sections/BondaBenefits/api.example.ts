/**
 * EJEMPLO DE INTEGRACIÓN CON API
 * 
 * Este archivo muestra cómo integrar el componente de beneficios
 * con una API real o con scraping de datos.
 */

import { Benefit, BenefitsResponse } from "./types";

// Ejemplo 1: Fetch desde API REST
export async function fetchBenefitsFromAPI(
  page: number = 1,
  perPage: number = 10,
  category?: string
): Promise<BenefitsResponse> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      ...(category && category !== "todos" && { category }),
    });

    const response = await fetch(`/api/benefits?${params}`);
    
    if (!response.ok) {
      throw new Error("Error al obtener beneficios");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching benefits:", error);
    throw error;
  }
}

// Ejemplo 2: Integración con scraping (Next.js API Route)
/**
 * Crear archivo: /app/api/benefits/route.ts
 * 
 * import { NextResponse } from 'next/server';
 * import * as cheerio from 'cheerio'; // npm install cheerio
 * 
 * export async function GET(request: Request) {
 *   try {
 *     const { searchParams } = new URL(request.url);
 *     const category = searchParams.get('category') || 'todos';
 * 
 *     // Scraping de la página de Bonda
 *     const response = await fetch('https://bonda.com.ar/beneficios');
 *     const html = await response.text();
 *     const $ = cheerio.load(html);
 * 
 *     const benefits: Benefit[] = [];
 * 
 *     $('.benefit-card').each((index, element) => {
 *       benefits.push({
 *         id: index,
 *         title: $(element).find('.title').text(),
 *         category: $(element).data('category'),
 *         discount: parseInt($(element).find('.discount').text()),
 *         description: $(element).find('.description').text(),
 *         conditions: $(element).find('.conditions').text(),
 *         logo: $(element).find('img').attr('src') || '🎁',
 *         popular: $(element).hasClass('popular'),
 *       });
 *     });
 * 
 *     return NextResponse.json({
 *       benefits,
 *       total: benefits.length,
 *       page: 1,
 *       perPage: benefits.length,
 *     });
 *   } catch (error) {
 *     return NextResponse.json(
 *       { error: 'Error al obtener beneficios' },
 *       { status: 500 }
 *     );
 *   }
 * }
 */

// Ejemplo 3: Hook personalizado para usar en el componente
/**
 * import { useState, useEffect } from 'react';
 * import { Benefit } from './types';
 * 
 * export function useBenefits(category: string = 'todos') {
 *   const [benefits, setBenefits] = useState<Benefit[]>([]);
 *   const [loading, setLoading] = useState(true);
 *   const [error, setError] = useState<Error | null>(null);
 * 
 *   useEffect(() => {
 *     async function loadBenefits() {
 *       try {
 *         setLoading(true);
 *         const data = await fetchBenefitsFromAPI(1, 50, category);
 *         setBenefits(data.benefits);
 *       } catch (err) {
 *         setError(err as Error);
 *       } finally {
 *         setLoading(false);
 *       }
 *     }
 * 
 *     loadBenefits();
 *   }, [category]);
 * 
 *   return { benefits, loading, error };
 * }
 */

// Ejemplo 4: Estructura de respuesta de la API de Bonda
export interface BondaAPIResponse {
  status: "success" | "error";
  data: {
    benefits: Array<{
      id: string;
      name: string;
      discount_percentage: number;
      category: string;
      description: string;
      terms_and_conditions: string;
      partner_logo: string;
      is_featured: boolean;
      valid_until: string;
      min_donation_amount?: number;
    }>;
    pagination: {
      total: number;
      page: number;
      per_page: number;
      total_pages: number;
    };
  };
}

// Función para transformar respuesta de Bonda a nuestro formato
export function transformBondaBenefit(bondaBenefit: BondaAPIResponse["data"]["benefits"][0]): Benefit {
  return {
    id: parseInt(bondaBenefit.id),
    title: bondaBenefit.name,
    category: mapCategory(bondaBenefit.category),
    discount: bondaBenefit.discount_percentage,
    description: bondaBenefit.description,
    conditions: bondaBenefit.terms_and_conditions,
    logo: bondaBenefit.partner_logo,
    popular: bondaBenefit.is_featured,
    expiryDate: bondaBenefit.valid_until,
    minDonation: bondaBenefit.min_donation_amount,
  };
}

function mapCategory(bondaCategory: string): Benefit["category"] {
  const categoryMap: Record<string, Benefit["category"]> = {
    health: "salud",
    wellness: "bienestar",
    services: "servicios",
    food: "gastronomia",
    education: "educacion",
  };

  return categoryMap[bondaCategory] || "servicios";
}


