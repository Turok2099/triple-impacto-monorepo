"use client";

import { useState } from "react";

// Tipos
type Category =
  | "todos"
  | "salud"
  | "bienestar"
  | "servicios"
  | "gastronomia"
  | "educacion";

interface Benefit {
  id: number;
  title: string;
  category: Category;
  discount: number;
  description: string;
  conditions: string;
  logo: string;
  popular: boolean;
}

// Mock data - Reemplazar con datos de API/scraping
const mockBenefits: Benefit[] = [
  {
    id: 1,
    title: "Consulta Médica General",
    category: "salud",
    discount: 30,
    description: "Consulta con médicos generales en centros de salud asociados",
    conditions: "Válido de lunes a viernes. Máximo 2 consultas por mes.",
    logo: "🏥",
    popular: true,
  },
  {
    id: 2,
    title: "Sesiones de Yoga",
    category: "bienestar",
    discount: 25,
    description: "Acceso a clases de yoga presenciales y online",
    conditions: "Pack de 4 sesiones mensuales. Reserva previa requerida.",
    logo: "🧘",
    popular: true,
  },
  {
    id: 3,
    title: "Asesoría Legal",
    category: "servicios",
    discount: 40,
    description: "Primera consulta legal gratuita con especialistas",
    conditions: "Válido para derecho familiar, laboral y civil.",
    logo: "⚖️",
    popular: false,
  },
  {
    id: 4,
    title: "Restaurantes Locales",
    category: "gastronomia",
    discount: 20,
    description: "Descuento en más de 50 restaurantes de la red Bonda",
    conditions: "No acumulable con otras promociones. Consumo mínimo $15.000",
    logo: "🍽️",
    popular: true,
  },
  {
    id: 5,
    title: "Cursos Online",
    category: "educacion",
    discount: 35,
    description: "Acceso a plataforma de cursos de capacitación profesional",
    conditions: "Más de 100 cursos disponibles. Certificado incluido.",
    logo: "📚",
    popular: false,
  },
  {
    id: 6,
    title: "Terapia Psicológica",
    category: "salud",
    discount: 30,
    description: "Sesiones con psicólogos certificados",
    conditions: "Online o presencial. Hasta 8 sesiones al mes.",
    logo: "💆",
    popular: true,
  },
  {
    id: 7,
    title: "Gimnasio y Fitness",
    category: "bienestar",
    discount: 50,
    description: "Membresía mensual en gimnasios asociados",
    conditions: "Incluye acceso a clases grupales y área de pesas.",
    logo: "💪",
    popular: true,
  },
  {
    id: 8,
    title: "Servicios Contables",
    category: "servicios",
    discount: 25,
    description: "Asesoramiento contable para emprendedores",
    conditions: "Primera consulta sin cargo. Descuento en servicios continuos.",
    logo: "💼",
    popular: false,
  },
  {
    id: 9,
    title: "Spa y Masajes",
    category: "bienestar",
    discount: 35,
    description: "Tratamientos de relajación y masajes terapéuticos",
    conditions:
      "Turnos sujetos a disponibilidad. Reserva con 48hs de anticipación.",
    logo: "💆‍♀️",
    popular: true,
  },
];

const categories = [
  { id: "todos", label: "Todos", icon: "🎯" },
  { id: "salud", label: "Salud", icon: "🏥" },
  { id: "bienestar", label: "Bienestar", icon: "🧘" },
  { id: "servicios", label: "Servicios", icon: "⚖️" },
  { id: "gastronomia", label: "Gastronomía", icon: "🍽️" },
  { id: "educacion", label: "Educación", icon: "📚" },
];

export default function BondaBenefitsSection() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("todos");
  const [sortBy, setSortBy] = useState<"discount" | "popular">("popular");
  const [itemsToShow, setItemsToShow] = useState(6);

  // Filtrar y ordenar beneficios
  const filteredBenefits = mockBenefits
    .filter(
      (benefit) =>
        selectedCategory === "todos" || benefit.category === selectedCategory
    )
    .sort((a, b) => {
      if (sortBy === "discount") {
        return b.discount - a.discount;
      }
      return b.popular === a.popular ? 0 : b.popular ? 1 : -1;
    });

  const visibleBenefits = filteredBenefits.slice(0, itemsToShow);
  const hasMore = itemsToShow < filteredBenefits.length;

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Catálogo de Beneficios Bonda
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Descuentos reales en servicios que usás todos los días. Cuanto más
            donás, más ahorrás.
          </p>
        </div>

        {/* Filtros */}
        <div className="mb-8 space-y-4">
          {/* Categorías */}
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as Category)}
                className={`px-5 py-2.5 rounded-full font-medium transition-all duration-200 ${
                  selectedCategory === cat.id
                    ? "bg-emerald-600 text-white shadow-lg scale-105"
                    : "bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200"
                }`}
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Ordenar */}
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setSortBy("popular")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                sortBy === "popular"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              🔥 Más populares
            </button>
            <button
              onClick={() => setSortBy("discount")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                sortBy === "discount"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              💰 Mayor descuento
            </button>
          </div>
        </div>

        {/* Grid de Beneficios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {visibleBenefits.map((benefit, index) => (
            <div
              key={benefit.id}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-emerald-200"
              style={{
                animation: `slideInUp 0.5s ease-out ${index * 0.1}s both`,
              }}
            >
              {/* Header de la card */}
              <div className="relative bg-linear-to-br from-emerald-500 to-blue-500 p-6 text-white">
                {benefit.popular && (
                  <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                    ⭐ Popular
                  </div>
                )}
                <div className="text-6xl mb-3">{benefit.logo}</div>
                <div className="text-5xl font-bold mb-1">
                  -{benefit.discount}%
                </div>
                <div className="text-emerald-100 text-sm font-medium">
                  de descuento
                </div>
              </div>

              {/* Contenido */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  {benefit.description}
                </p>

                {/* Condiciones */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <span className="text-sm shrink-0">ℹ️</span>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {benefit.conditions}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 transform group-hover:scale-105 shadow-lg hover:shadow-xl">
                  Obtener con mi donación →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Mensaje si no hay resultados */}
        {filteredBenefits.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No hay beneficios disponibles
            </h3>
            <p className="text-gray-600">Intenta con otra categoría o filtro</p>
          </div>
        )}

        {/* Botón cargar más */}
        {hasMore && (
          <div className="text-center">
            <button
              onClick={() => setItemsToShow(itemsToShow + 6)}
              className="px-8 py-4 bg-white text-gray-800 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 border-2 border-gray-200 hover:border-emerald-300"
            >
              Cargar más beneficios ({filteredBenefits.length - itemsToShow}{" "}
              restantes)
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold text-emerald-600 mb-2">
                {mockBenefits.length}
              </div>
              <div className="text-gray-600 text-sm">Beneficios activos</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">35%</div>
              <div className="text-gray-600 text-sm">Descuento promedio</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">50+</div>
              <div className="text-gray-600 text-sm">Comercios aliados</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">
                100%
              </div>
              <div className="text-gray-600 text-sm">Satisfacción</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
