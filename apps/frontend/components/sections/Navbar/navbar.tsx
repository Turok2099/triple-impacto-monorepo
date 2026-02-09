"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  // Prevenir scroll cuando el menú mobile está abierto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  const navLinks = [
    { name: "ONGs", href: "/ongs", icon: "🤝" },
    { name: "Sobre nosotros", href: "/about", icon: "ℹ️" },
    { name: "Preguntas frecuentes", href: "/faqs", icon: "❓" },
    { name: "Contacto", href: "/contact", icon: "📞" },
  ];

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo + Branding */}
            <a
              href="/"
              className="flex items-center group transition-transform hover:scale-110"
            >
              <Image
                src="https://res.cloudinary.com/dxbtafe9u/image/upload/v1768059717/LOGO_CLUB_TRIPLE_IMPACTO_jztcqa.png"
                alt="Club Triple Impacto"
                width={180}
                height={60}
                className="h-14 w-auto object-contain"
                priority
              />
            </a>

            {/* Links Desktop */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="px-4 py-2 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200 font-medium text-sm"
                >
                  {link.name}
                </a>
              ))}
            </div>

            {/* CTAs Desktop */}
            <div className="hidden lg:flex items-center gap-3">
              {!isLoading && (
                <>
                  {/* Auth - Usuario logueado */}
                  {isAuthenticated && user ? (
                    <div className="flex items-center gap-3">
                      <a
                        href="/dashboard"
                        className="px-4 py-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all duration-200 font-medium text-sm"
                      >
                        Dashboard
                      </a>
                      <span className="text-sm text-gray-700 font-medium">
                        Hola,{" "}
                        <span className="text-emerald-600">{user.nombre}</span>
                      </span>
                      <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium text-sm"
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  ) : (
                    /* Auth - Usuario no logueado */
                    <a
                      href="/login"
                      className="px-4 py-2 text-gray-700 hover:text-emerald-600 transition-colors font-medium text-sm"
                    >
                      Iniciar sesión
                    </a>
                  )}

                </>
              )}
            </div>

            {/* Botones Mobile */}
            <div className="flex lg:hidden items-center gap-2">
              {/* Hamburger Menu */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Menú"
              >
                {isMobileMenuOpen ? (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ${
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>

        {/* Menu Panel */}
        <div
          className={`absolute top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-2xl transition-transform duration-300 ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header del menu */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center text-xl">
                💚
              </div>
              <div>
                <div className="text-gray-900 font-bold">
                  Club Triple Impacto
                </div>
                <div className="text-emerald-600 text-xs">Menú</div>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Links */}
          <div className="p-6 space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={handleNavClick}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all duration-200 font-medium"
              >
                <span className="text-2xl">{link.icon}</span>
                <span>{link.name}</span>
              </a>
            ))}

            {/* Separador */}
            <div className="border-t border-gray-200 my-4"></div>

            {/* Auth en mobile */}
            {!isLoading && (
              <>
                {isAuthenticated && user ? (
                  <>
                    <div className="px-4 py-3 bg-emerald-50 rounded-xl">
                      <div className="text-sm text-gray-600">Bienvenido/a</div>
                      <div className="text-lg font-bold text-emerald-600">
                        {user.nombre}
                      </div>
                    </div>
                    <a
                      href="/dashboard"
                      onClick={handleNavClick}
                      className="flex items-center gap-3 px-4 py-3 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors font-medium"
                    >
                      <span className="text-2xl">📊</span>
                      <span>Dashboard</span>
                    </a>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                    >
                      <span className="text-2xl">🚪</span>
                      <span>Cerrar sesión</span>
                    </button>
                  </>
                ) : (
                  <>
                    <a
                      href="/login"
                      onClick={handleNavClick}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                    >
                      <span className="text-2xl">👤</span>
                      <span>Iniciar sesión</span>
                    </a>

                    <a
                      href="/registro"
                      onClick={handleNavClick}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                    >
                      <span className="text-2xl">✨</span>
                      <span>Registrarse</span>
                    </a>
                  </>
                )}
              </>
            )}
          </div>

        </div>
      </div>

      {/* Spacer para compensar el navbar fixed */}
      <div className="h-20"></div>
    </>
  );
}
