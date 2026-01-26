export default function OngHero() {
    return (
        <section className="relative min-h-screen flex items-center pt-16 overflow-hidden bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/50">
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/40 to-teal-200/40 rounded-full blur-3xl" />
                <div className="absolute top-1/2 -left-20 w-60 h-60 bg-gradient-to-br from-teal-200/30 to-emerald-200/30 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-1/4 w-40 h-40 bg-gradient-to-br from-emerald-300/20 to-teal-300/20 rounded-full blur-2xl" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Content */}
                    <div className="text-center lg:text-left">
                        <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full mb-6">
                            🌱 Transformando vidas desde 2010
                        </span>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                            Construyendo un{" "}
                            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                futuro mejor
                            </span>{" "}
                            para todos
                        </h1>

                        <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
                            Somos una organización sin fines de lucro dedicada a crear
                            oportunidades y mejorar la calidad de vida de comunidades
                            vulnerables a través de programas de educación, salud y
                            desarrollo sostenible.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <a
                                href="#donar"
                                className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-full hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-center"
                            >
                                Donar ahora
                            </a>
                            <a
                                href="#programas"
                                className="px-8 py-4 bg-white text-emerald-700 font-bold rounded-full border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-center"
                            >
                                Conocé nuestros programas
                            </a>
                        </div>

                        {/* Quick stats */}
                        <div className="mt-12 flex flex-wrap gap-8 justify-center lg:justify-start">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-emerald-700">+15,000</p>
                                <p className="text-sm text-gray-500">Vidas impactadas</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-emerald-700">12</p>
                                <p className="text-sm text-gray-500">Años de trayectoria</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-emerald-700">50+</p>
                                <p className="text-sm text-gray-500">Voluntarios activos</p>
                            </div>
                        </div>
                    </div>

                    {/* Visual Block (placeholder) */}
                    <div className="relative hidden lg:block">
                        <div className="relative w-full aspect-square max-w-lg mx-auto">
                            {/* Main visual card */}
                            <div className="absolute inset-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
                                <div className="text-center text-white p-8 relative z-10">
                                    <div className="text-6xl mb-4">🤝</div>
                                    <p className="text-2xl font-bold">Juntos hacemos más</p>
                                    <p className="text-emerald-100 mt-2">
                                        Tu apoyo transforma vidas
                                    </p>
                                </div>
                            </div>

                            {/* Floating elements */}
                            <div className="absolute -top-4 -left-4 w-24 h-24 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                                <span className="text-4xl">💚</span>
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-32 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center gap-2 px-4">
                                <span className="text-3xl">🎓</span>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-gray-800">+500</p>
                                    <p className="text-xs text-gray-500">Becas otorgadas</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                <svg
                    className="w-6 h-6 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                </svg>
            </div>
        </section>
    );
}
