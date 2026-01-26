const missionBullets = [
    {
        icon: "🎯",
        title: "Enfoque comunitario",
        description:
            "Trabajamos directamente con las comunidades para entender sus necesidades reales.",
    },
    {
        icon: "🌱",
        title: "Desarrollo sostenible",
        description:
            "Nuestros programas están diseñados para generar impacto a largo plazo.",
    },
    {
        icon: "🤝",
        title: "Alianzas estratégicas",
        description:
            "Colaboramos con organizaciones locales e internacionales para maximizar nuestro alcance.",
    },
];

const actionAreas = [
    "Educación",
    "Salud",
    "Medio Ambiente",
    "Desarrollo Económico",
    "Inclusión Social",
    "Cultura",
];

export default function OngMission() {
    return (
        <section
            id="mision"
            className="py-20 lg:py-28 bg-white scroll-mt-16"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Text content */}
                    <div>
                        <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full mb-4">
                            Nuestra Misión
                        </span>

                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                            Creemos en el poder de las{" "}
                            <span className="text-emerald-600">comunidades</span>
                        </h2>

                        <p className="text-lg text-gray-600 mb-8">
                            Nuestra misión es empoderar a las comunidades más vulnerables a
                            través de programas integrales que promuevan la educación, la
                            salud y el desarrollo sostenible. Creemos que cada persona merece
                            la oportunidad de alcanzar su máximo potencial.
                        </p>

                        {/* Bullets */}
                        <div className="space-y-6">
                            {missionBullets.map((bullet, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl">
                                        {bullet.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">
                                            {bullet.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm">{bullet.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Areas of action */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 lg:p-10">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">
                            Áreas de acción
                        </h3>

                        <div className="flex flex-wrap gap-3 mb-8">
                            {actionAreas.map((area, index) => (
                                <span
                                    key={index}
                                    className="px-4 py-2 bg-white text-gray-700 rounded-full text-sm font-medium shadow-sm border border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all cursor-default"
                                >
                                    {area}
                                </span>
                            ))}
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white text-xl">
                                    📍
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">Presencia nacional</p>
                                    <p className="text-sm text-gray-500">
                                        Trabajamos en 8 provincias
                                    </p>
                                </div>
                            </div>
                            <p className="text-gray-600 text-sm">
                                Llevamos nuestros programas a las regiones donde más se
                                necesitan, adaptándonos a las realidades locales y construyendo
                                redes de apoyo en cada comunidad.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
