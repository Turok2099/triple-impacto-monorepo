"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  nombre: string;
  email: string;
  bondaCode?: string | null;
  telefono?: string | null;
  dni?: string | null;
  provincia?: string | null;
  localidad?: string | null;
}

const LOGOUT_DELAY_MS = 700;

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  handleSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Verificar si hay un usuario logueado al cargar
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
      }
    }

    setIsLoading(false);
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      setUser(null);
      window.location.href = "/";
    }, LOGOUT_DELAY_MS);
  };

  const handleSessionExpired = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    setUser(null);
    // Guardar mensaje de sesión expirada
    sessionStorage.setItem("session_expired", "true");
    // Redirigir al login
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isLoggingOut,
        login,
        logout,
        handleSessionExpired,
      }}
    >
      {children}
      {isLoggingOut && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/95 backdrop-blur-sm"
          aria-live="polite"
          aria-label="Cerrando sesión"
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
            <p className="text-gray-700 font-medium">Cerrando sesión...</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
