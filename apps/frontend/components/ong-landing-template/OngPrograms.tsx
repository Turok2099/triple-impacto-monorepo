const programs = [
    {
        id: 1,
        icon: "🎓",
        title: "Educación para Todos",
        description:
            "Programa de becas y apoyo escolar para niños y jóvenes de comunidades vulnerables. Incluye tutorías, materiales y acompañamiento familiar.",
        stats: "+500 becarios activos",
    },
    {
        id: 2,
        icon: "🏥",
        title: "Salud Comunitaria",
        description:
            "Campañas de prevención, atención médica primaria y acceso a medicamentos esenciales para familias sin cobertura de salud.",
        stats: "12 centros de salud",
    },
    {
        id: 3,
        icon: "🌿",
        title: "Desarrollo Sostenible",
        description:
            "Capacitación en oficios, emprendimientos productivos y proyectos de agricultura familiar para generar autonomía económica.",
        stats: "200+ emprendimientos",
    },
];

export default function OngPrograms() {
    return (
        <section
            id="programas"
            className="py-20 lg:py-28 bg-gradient-to-b from-gray-50 to-white scroll-mt-16"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full mb-4">
                        Nuestros Programas
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                        Programas que{" "}
                        <span className="text-emerald-600">transforman vidas</span>
                    </h2>
                    <p className="text-lg text-gray-600">
                        Desarrollamos iniciativas integrales que abordan las necesidades más
                        urgentes de las comunidades, promoviendo el desarrollo humano en
                        todas sus dimensiones.
                    </p>
                </div>

                {/* Programs Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {programs.map((program) => (
                        <article
                            key={program.id}
                            className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                                {program.icon}
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                                {program.title}
                            </h3>

                            <p className="text-gray-600 mb-6 leading-relaxed">
                                {program.description}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <span className="text-sm font-medium text-emerald-600">
                                    {program.stats}
                                </span>
                                <button
                                    type="button"
                                    className="text-sm font-semibold text-gray-500 hover:text-emerald-600 flex items-center gap-1 group-hover:gap-2 transition-all"
                                >
                                    Ver más
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </article>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center mt-12">
                    <a
                        href="#donar"
                        className="inline-flex items-center gap-2 px-6 py-3 text-emerald-700 font-semibold hover:text-emerald-800 transition-colors"
                    >
                        Conocé cómo podés sumarte
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                        </svg>
                    </a>
                </div>
            </div>
        </section>
    );
}
