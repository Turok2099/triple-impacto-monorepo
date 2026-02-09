"use client";

import { useState, useEffect } from "react";
import { obtenerCuponesPublicos } from "@/lib/bonda";

interface Sponsor {
  id: string;
  name: string;
  logo: string;
}

// Función para obtener marcas únicas aleatorias
const getRandomSponsors = (allSponsors: Sponsor[], count: number = 10): Sponsor[] => {
  const shuffled = [...allSponsors].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export default function SponsorsSection() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [allSponsors, setAllSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarMarcas() {
      try {
        setLoading(true);
        
        // Obtener todos los cupones públicos (hasta 150 para tener variedad)
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
        const response = await fetch(`${API_URL}/public/cupones-bonda?limite=150`);
        const data = await response.json();

        // Extraer marcas únicas con sus logos
        const marcasUnicas = new Map<string, Sponsor>();
        data.cupones.forEach((cupon: any) => {
          const nombreEmpresa = cupon.empresa?.nombre || cupon.empresa;
          const logoEmpresa = cupon.logo_empresa;
          
          if (nombreEmpresa && logoEmpresa && !marcasUnicas.has(nombreEmpresa)) {
            marcasUnicas.set(nombreEmpresa, {
              id: cupon.id,
              name: nombreEmpresa,
              logo: logoEmpresa,
            });
          }
        });

        const todasLasMarcas = Array.from(marcasUnicas.values());
        setAllSponsors(todasLasMarcas);
        
        // Seleccionar 10 marcas aleatorias iniciales
        const marcasSeleccionadas = getRandomSponsors(todasLasMarcas, 10);
        setSponsors(marcasSeleccionadas);
      } catch (error) {
        console.error("Error al cargar marcas aliadas:", error);
      } finally {
        setLoading(false);
      }
    }

    cargarMarcas();
  }, []);

  // Rotación automática de marcas cada 5 segundos
  useEffect(() => {
    if (allSponsors.length === 0) return;

    const interval = setInterval(() => {
      const nuevasMarcas = getRandomSponsors(allSponsors, 10);
      setSponsors(nuevasMarcas);
    }, 5000); // Cambia cada 5 segundos

    return () => clearInterval(interval);
  }, [allSponsors]);

  if (loading) {
    return (
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="container mx-auto px-8 lg:max-w-7xl sm:max-w-xl md:max-w-full sm:px-12 md:px-16">
          <div className="text-center mb-12">
            <h2 className="font-bold text-4xl sm:text-5xl text-gray-900 mb-4">
              Marcas Aliadas
            </h2>
            <p className="max-w-2xl mx-auto text-xl text-gray-600">
              Empresas comprometidas con{" "}
              <span className="font-semibold" style={{ color: "#16a459" }}>
                Club Triple Impacto
              </span>{" "}
              que ofrecen beneficios exclusivos a nuestra comunidad
            </p>
          </div>
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="container mx-auto px-8 lg:max-w-7xl sm:max-w-xl md:max-w-full sm:px-12 md:px-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-bold text-4xl sm:text-5xl text-gray-900 mb-4">
            Marcas Aliadas
          </h2>
          <p className="max-w-2xl mx-auto text-xl text-gray-600">
            Empresas comprometidas con{" "}
            <span className="font-semibold" style={{ color: "#16a459" }}>
              Club Triple Impacto
            </span>{" "}
            que ofrecen beneficios exclusivos a nuestra comunidad
          </p>
        </div>

        {/* Grid de logos - 10 marcas en total */}
        <div className="grid gap-8 grid-cols-2 md:gap-y-16 md:grid-cols-5">
          {sponsors.map((sponsor, index) => (
            <div
              key={`${sponsor.id}-${Date.now()}`}
              className="w-full flex items-center justify-center animate-fadeIn"
              style={{
                animation: `fadeIn 0.8s ease-in-out ${index * 0.1}s both`,
              }}
            >
              <div
                className="relative p-6 rounded-lg bg-white shadow-md overflow-hidden"
                style={{
                  width: "100%",
                  height: "120px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={sponsor.logo}
                  alt={sponsor.name}
                  className="object-contain"
                  style={{
                    maxWidth: "130%",
                    maxHeight: "130%",
                  }}
                  title={sponsor.name}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Agregar keyframes para la animación */}
        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </section>
  );
}
