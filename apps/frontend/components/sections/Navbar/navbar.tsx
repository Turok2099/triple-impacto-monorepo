"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const pathname = usePathname();

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

  const handleNavClick = (e?: React.MouseEvent<HTMLAnchorElement>, href?: string) => {
    if (e && href && pathname === href) {
      e.preventDefault();
    }
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
            <Link
              href="/"
              onClick={(e) => handleNavClick(e, "/")}
              className="flex items-center group transition-transform hover:scale-110"
            >
              <Image
                src="/ayani_logo.png"
                alt="AYNI"
                width={180}
                height={60}
                className="h-14 w-auto object-contain"
                priority
              />
            </Link>

            {/* Links Desktop */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    if (pathname === link.href) e.preventDefault();
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-200 font-medium text-sm"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* CTAs Desktop */}
            <div className="hidden lg:flex items-center gap-3">
              {!isLoading && (
                <>
                  {/* Auth - Usuario logueado */}
                  {isAuthenticated && user ? (
                    <div className="flex items-center gap-3">
                      <Link
                        href="/dashboard"
                        onClick={(e) => {
                          if (pathname === "/dashboard") e.preventDefault();
                        }}
                        className="px-4 py-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all duration-200 font-medium text-sm"
                      >
                        Dashboard
                      </Link>
                      <span className="text-sm text-gray-700 font-medium">
                        Hola,{" "}
                        <span className="text-teal-600">{user.nombre}</span>
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
                    <Link
                      href="/login"
                      onClick={(e) => {
                        if (pathname === "/login") e.preventDefault();
                      }}
                      className="px-4 py-2 text-gray-700 hover:text-teal-600 transition-colors font-medium text-sm"
                    >
                      Iniciar sesión
                    </Link>
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
        className={`fixed inset-0 z-[60] lg:hidden transition-all duration-300 ${
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
          className={`absolute top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl transition-transform duration-300 flex flex-col ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header del menu */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center text-xl shadow-inner shadow-white/20">
                💚
              </div>
              <div>
                <div className="text-gray-900 font-black text-lg tracking-tight">
                  AYNI
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors"
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

          {/* Links e Info */}
          <div className="p-5 space-y-2 flex-1 overflow-y-auto">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-teal-50 hover:text-teal-600 rounded-xl transition-all duration-200 font-medium"
              >
                <span className="text-2xl">{link.icon}</span>
                <span>{link.name}</span>
              </Link>
            ))}

            {/* Separador */}
            <div className="border-t border-gray-200 my-4"></div>

            {/* Auth en mobile */}
            {!isLoading && (
              <>
                {isAuthenticated && user ? (
                  <>
                    <div className="px-4 py-3 bg-teal-50 rounded-xl">
                      <div className="text-sm text-gray-600">Bienvenido/a</div>
                      <div className="text-lg font-bold text-teal-600">
                        {user.nombre}
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={(e) => handleNavClick(e, "/dashboard")}
                      className="flex items-center gap-3 px-4 py-3 text-teal-600 hover:bg-teal-50 rounded-xl transition-colors font-medium"
                    >
                      <span className="text-2xl">📊</span>
                      <span>Dashboard</span>
                    </Link>
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
                    <Link
                      href="/login"
                      onClick={(e) => handleNavClick(e, "/login")}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                    >
                      <span className="text-2xl">👤</span>
                      <span>Iniciar sesión</span>
                    </Link>

                    <Link
                      href="/registro"
                      onClick={(e) => handleNavClick(e, "/registro")}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                    >
                      <span className="text-2xl">✨</span>
                      <span>Registrarse</span>
                    </Link>
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
