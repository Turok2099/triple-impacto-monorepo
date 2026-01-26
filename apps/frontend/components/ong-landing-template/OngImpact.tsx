const impactMetrics = [
    {
        id: 1,
        value: "+15,000",
        label: "Personas beneficiadas",
        description: "Familias y comunidades que han participado en nuestros programas",
        icon: "👥",
    },
    {
        id: 2,
        value: "95%",
        label: "Tasa de finalización",
        description: "De los beneficiarios completan exitosamente los programas",
        icon: "📈",
    },
    {
        id: 3,
        value: "$2.5M",
        label: "Invertidos en comunidades",
        description: "Recursos destinados directamente a proyectos comunitarios",
        icon: "💰",
    },
];

export default function OngImpact() {
    return (
        <section className="py-20 lg:py-28 bg-gradient-to-br from-emerald-600 to-teal-700 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%221%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="inline-block px-3 py-1 bg-white/20 text-white text-sm font-semibold rounded-full mb-4">
                        Nuestro Impacto
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                        Resultados que hablan por sí mismos
                    </h2>
                    <p className="text-lg text-emerald-100">
                        Medimos nuestro impacto constantemente para asegurar que cada
                        recurso se traduzca en cambios reales y duraderos.
                    </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid md:grid-cols-3 gap-8">
                    {impactMetrics.map((metric) => (
                        <div
                            key={metric.id}
                            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20 hover:bg-white/20 transition-colors"
                        >
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                                {metric.icon}
                            </div>

                            <p className="text-4xl sm:text-5xl font-bold text-white mb-2">
                                {metric.value}
                            </p>

                            <p className="text-lg font-semibold text-white mb-2">
                                {metric.label}
                            </p>

                            <p className="text-sm text-emerald-100">{metric.description}</p>
                        </div>
                    ))}
                </div>

                {/* Trust badges */}
                <div className="mt-16 pt-12 border-t border-white/20">
                    <p className="text-center text-emerald-100 mb-6 text-sm font-medium">
                        Avalados por organizaciones nacionales e internacionales
                    </p>
                    <div className="flex flex-wrap justify-center items-center gap-8">
                        {["Certificación A", "Partner B", "Alianza C", "Premio D"].map(
                            (badge, index) => (
                                <div
                                    key={index}
                                    className="px-6 py-3 bg-white/10 rounded-lg text-white/80 text-sm font-medium"
                                >
                                    {badge}
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
