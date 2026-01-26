const footerLinks = [
    { label: "Política de privacidad", href: "#" },
    { label: "Términos y condiciones", href: "#" },
    { label: "Contacto", href: "mailto:contacto@ong.org" },
];

const socialLinks = [
    { name: "Instagram", href: "#", icon: "📷" },
    { name: "Twitter/X", href: "#", icon: "🐦" },
    { name: "Facebook", href: "#", icon: "📘" },
    { name: "LinkedIn", href: "#", icon: "💼" },
];

export default function OngFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid md:grid-cols-3 gap-8 items-center">
                    {/* Logo & Tagline */}
                    <div className="text-center md:text-left">
                        <a
                            href="#"
                            className="inline-flex items-center gap-2 text-xl font-bold text-white mb-2"
                        >
                            <span className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-sm">
                                ONG
                            </span>
                            <span>Nombre ONG</span>
                        </a>
                        <p className="text-gray-400 text-sm">
                            Transformando vidas, construyendo futuro.
                        </p>
                    </div>

                    {/* Links */}
                    <div className="flex flex-wrap justify-center gap-6">
                        {footerLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="text-gray-400 hover:text-white text-sm transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* Social Links */}
                    <div className="flex justify-center md:justify-end gap-3">
                        {socialLinks.map((social) => (
                            <a
                                key={social.name}
                                href={social.href}
                                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-lg hover:bg-emerald-600 transition-colors"
                                aria-label={social.name}
                            >
                                {social.icon}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-800 mt-8 pt-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-gray-500 text-sm text-center sm:text-left">
                            © {currentYear} Nombre ONG. Todos los derechos reservados.
                        </p>
                        <p className="text-gray-500 text-sm">
                            Hecho con 💚 para la comunidad
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
