const helpOptions = [
    {
        id: "donate",
        icon: "💚",
        title: "Doná",
        description:
            "Tu donación nos permite sostener y expandir nuestros programas. Cada aporte, sin importar el monto, genera un impacto real.",
        cta: {
            label: "Donar ahora",
            href: "#",
            primary: true,
        },
    },
    {
        id: "volunteer",
        icon: "🙋",
        title: "Sé voluntario/a",
        description:
            "Sumá tu tiempo y talento a nuestra causa. Buscamos personas comprometidas en diversas áreas: educación, comunicación, logística y más.",
        cta: {
            label: "Quiero ser voluntario",
            href: "mailto:voluntarios@ong.org?subject=Quiero%20ser%20voluntario",
            primary: false,
        },
    },
    {
        id: "share",
        icon: "📢",
        title: "Difundí",
        description:
            "Ayudanos a llegar a más personas compartiendo nuestra misión en tus redes sociales. La visibilidad también es una forma de ayudar.",
        cta: {
            label: "Compartir en redes",
            href: "#",
            primary: false,
        },
        socialLinks: [
            { name: "Instagram", href: "#", icon: "📷" },
            { name: "Twitter/X", href: "#", icon: "🐦" },
            { name: "Facebook", href: "#", icon: "📘" },
        ],
    },
];

export default function OngHowToHelp() {
    return (
        <section id="donar" className="py-20 lg:py-28 bg-white scroll-mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="inline-block px-3 py-1 bg-teal-100 text-teal-700 text-sm font-semibold rounded-full mb-4">
                        Sumate
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                        ¿Cómo podés <span className="text-teal-600">ayudar</span>?
                    </h2>
                    <p className="text-lg text-gray-600">
                        Hay muchas formas de sumarte a nuestra causa. Elegí la que mejor se
                        adapte a tus posibilidades y sé parte del cambio.
                    </p>
                </div>

                {/* Help Options Grid */}
                <div className="grid md:grid-cols-3 gap-8">
                    {helpOptions.map((option) => (
                        <div
                            key={option.id}
                            className={`rounded-2xl p-8 ${option.id === "donate"
                                    ? "bg-gradient-to-br from-teal-50 to-teal-50 border-2 border-teal-200 shadow-lg"
                                    : "bg-gray-50 border border-gray-100"
                                }`}
                        >
                            <div className="text-4xl mb-4">{option.icon}</div>

                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                                {option.title}
                            </h3>

                            <p className="text-gray-600 mb-6">{option.description}</p>

                            {/* CTA Button */}
                            <a
                                href={option.cta.href}
                                className={`inline-flex items-center justify-center w-full px-6 py-3 rounded-full font-semibold transition-all ${option.cta.primary
                                        ? "bg-gradient-to-r from-teal-600 to-teal-600 text-white hover:from-teal-700 hover:to-teal-700 shadow-md hover:shadow-lg"
                                        : "bg-white text-teal-700 border-2 border-teal-200 hover:border-teal-400 hover:bg-teal-50"
                                    }`}
                            >
                                {option.cta.label}
                            </a>

                            {/* Social Links (for share option) */}
                            {option.socialLinks && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <p className="text-sm text-gray-500 mb-3">
                                        Seguinos en redes:
                                    </p>
                                    <div className="flex gap-3 justify-center">
                                        {option.socialLinks.map((social) => (
                                            <a
                                                key={social.name}
                                                href={social.href}
                                                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl hover:bg-teal-100 transition-colors border border-gray-200 hover:border-teal-300"
                                                aria-label={social.name}
                                            >
                                                {social.icon}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Additional CTA */}
                <div className="mt-16 text-center">
                    <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 bg-gradient-to-r from-teal-50 to-teal-50 rounded-2xl border border-teal-100">
                        <div className="text-4xl">🤝</div>
                        <div className="text-center sm:text-left">
                            <p className="font-bold text-gray-900">
                                ¿Sos una empresa o institución?
                            </p>
                            <p className="text-gray-600 text-sm">
                                Conocé nuestros programas de alianzas corporativas
                            </p>
                        </div>
                        <a
                            href="mailto:alianzas@ong.org"
                            className="px-5 py-2.5 bg-white text-teal-700 font-semibold rounded-full border border-teal-200 hover:border-teal-400 transition-all whitespace-nowrap"
                        >
                            Contactanos
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
