"use client";

import {
  Store,
  ShoppingBag,
  Coffee,
  Utensils,
  Home,
  Heart,
  Building2,
  Sparkles,
  Zap,
  Award,
  Briefcase,
  GraduationCap,
} from "lucide-react";

const sponsors = [
  { id: 1, Icon: Store, name: "Retail Store" },
  { id: 2, Icon: ShoppingBag, name: "Shopping Brand" },
  { id: 3, Icon: Coffee, name: "Coffee Shop" },
  { id: 4, Icon: Utensils, name: "Restaurant" },
  { id: 5, Icon: Home, name: "Home Services" },
  { id: 6, Icon: Heart, name: "Healthcare" },
  { id: 7, Icon: Building2, name: "Real Estate" },
  { id: 8, Icon: Sparkles, name: "Beauty & Wellness" },
  { id: 9, Icon: Zap, name: "Energy" },
  { id: 10, Icon: Award, name: "Premium Brand" },
  { id: 11, Icon: Briefcase, name: "Professional Services" },
  { id: 12, Icon: GraduationCap, name: "Education" },
];

export default function SponsorsSection() {
  return (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="container mx-auto px-8 lg:max-w-7xl sm:max-w-xl md:max-w-full sm:px-12 md:px-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-bold text-4xl sm:text-5xl text-gray-900 mb-4">
            Marcas Aliadas
          </h2>
          <p className="max-w-2xl mx-auto text-xl text-gray-600">
            Empresas comprometidas con el{" "}
            <span className="font-semibold" style={{ color: "#16a459" }}>
              Club Triple Impacto
            </span>{" "}
            que ofrecen beneficios exclusivos a nuestra comunidad
          </p>
        </div>

        {/* Grid de logos */}
        <div className="grid gap-8 grid-cols-2 md:gap-y-16 md:grid-cols-6">
          {sponsors.map((sponsor, index) => (
            <span
              key={sponsor.id}
              className="w-full flex items-center justify-center group cursor-pointer"
            >
              <span className="sr-only">{sponsor.name}</span>
              <div
                aria-hidden="true"
                className="relative p-4 rounded-lg transition-all duration-300 hover:scale-110"
                style={{
                  color:
                    index % 3 === 0
                      ? "#888888"
                      : index % 3 === 1
                      ? "#888888"
                      : "#888888",
                }}
              >
                <sponsor.Icon
                  className="w-16 h-16 transition-all duration-300"
                  strokeWidth={1.5}
                  style={{
                    color: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    const color =
                      index % 3 === 0
                        ? "#16a459"
                        : index % 3 === 1
                        ? "#385da0"
                        : "#cfc755";
                    e.currentTarget.style.color = color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#888888";
                  }}
                />
              </div>
            </span>
          ))}
        </div>

        {/* Mensaje adicional */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-4">
            ¿Tu empresa quiere ser parte del cambio?
          </p>
          <button
            className="px-8 py-3 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            style={{ backgroundColor: "#16a459" }}
          >
            Sumate como marca aliada
          </button>
        </div>
      </div>
    </section>
  );
}
