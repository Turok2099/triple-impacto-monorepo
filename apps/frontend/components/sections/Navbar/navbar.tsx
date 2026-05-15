"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { HeartHandshake, Info, HelpCircle, PhoneCall, LayoutDashboard, LogOut, User, Sparkles, Menu, X } from "lucide-react";

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
    { name: "ONGs", href: "/ongs", icon: <HeartHandshake className="w-5 h-5" /> },
    { name: "Sobre nosotros", href: "/about", icon: <Info className="w-5 h-5" /> },
    { name: "Preguntas frecuentes", href: "/faqs", icon: <HelpCircle className="w-5 h-5" /> },
    { name: "Contacto", href: "/contact", icon: <PhoneCall className="w-5 h-5" /> },
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
                src="https://res.cloudinary.com/dxbtafe9u/image/upload/q_auto,f_auto,w_200,c_limit/v1775685229/ISOLOGOTIPO_AYNI_VERDE_FONDO_TRANSPARENTE_lx4yvh.png"
                alt="AYNI"
                width={140}
                height={46}
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
                  className="px-4 py-2 text-gray-700 hover:text-[#40a8ab] hover:bg-teal-50 rounded-lg transition-all duration-200 font-medium text-sm"
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
                        className="px-4 py-2 text-[#40a8ab] hover:text-[#2c8184] hover:bg-teal-50 rounded-lg transition-all duration-200 font-medium text-sm"
                      >
                        Dashboard
                      </Link>
                      <span className="text-sm text-gray-700 font-medium">
                        Hola,{" "}
                        <span className="text-[#40a8ab]">{user.nombre}</span>
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
                      className="px-4 py-2 text-gray-700 hover:text-[#40a8ab] transition-colors font-medium text-sm"
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
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
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
              <div className="size-10 rounded-xl flex items-center justify-center overflow-hidden bg-white border border-slate-100 p-1.5 shadow-sm">
                <img src="/icon.png" alt="AYNI" className="w-full h-full object-contain" />
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
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Links e Info */}
          <div className="p-5 space-y-2 flex-1 overflow-y-auto">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-teal-50 hover:text-[#40a8ab] rounded-xl transition-all duration-200 font-medium"
              >
                <span className="text-[#40a8ab] opacity-80">{link.icon}</span>
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
                      <div className="text-lg font-bold text-[#40a8ab]">
                        {user.nombre}
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={(e) => handleNavClick(e, "/dashboard")}
                      className="flex items-center gap-3 px-4 py-3 text-[#40a8ab] hover:bg-teal-50 rounded-xl transition-colors font-medium"
                    >
                      <LayoutDashboard className="w-5 h-5 opacity-80" />
                      <span>Dashboard</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                    >
                      <LogOut className="w-5 h-5 opacity-80" />
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
                      <User className="w-5 h-5 text-gray-400" />
                      <span>Iniciar sesión</span>
                    </Link>

                    <Link
                      href="/registro"
                      onClick={(e) => handleNavClick(e, "/registro")}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                    >
                      <Sparkles className="w-5 h-5 text-gray-400" />
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
