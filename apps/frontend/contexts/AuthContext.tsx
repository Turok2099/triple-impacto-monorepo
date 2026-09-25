"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "@/lib/apiClient";

interface User {
  id: string;
  nombre: string;
  email: string;
  bondaCode?: string | null;
  telefono?: string | null;
  dni?: string | null;
  provincia?: string | null;
  localidad?: string | null;
  role?: string;
  avatar_url?: string | null;
}

const LOGOUT_DELAY_MS = 700;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

// Ventana antes de que expire el access token en la que intentamos renovarlo
// solo (sin esperar a que el backend responda 401 en medio de una acción del usuario).
const REFRESH_MARGIN_MS = 60 * 1000; // 1 min antes de expirar

// Inactividad: a los 30 min sin interacción, logout automático.
// A los 28 min, aviso previo para que el usuario pueda seguir conectado.
const INACTIVITY_LOGOUT_MS = 30 * 60 * 1000;
const INACTIVITY_WARNING_MS = 28 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  showInactivityWarning: boolean;
  login: (token: string, refreshToken: string | null | undefined, userData: User) => void;
  logout: () => void;
  handleSessionExpired: () => void;
  updateUser: (data: Partial<User>) => void;
  stayConnected: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeToken(token: string): any | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload?.exp) return true;
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);

  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactivityWarningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactivityLogoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRefreshTimer = () => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  };

  const clearInactivityTimers = () => {
    if (inactivityWarningRef.current) {
      clearTimeout(inactivityWarningRef.current);
      inactivityWarningRef.current = null;
    }
    if (inactivityLogoutRef.current) {
      clearTimeout(inactivityLogoutRef.current);
      inactivityLogoutRef.current = null;
    }
  };

  /** Renueva el access token con el refresh token guardado; agenda el próximo refresh. */
  const silentRefresh = async (): Promise<boolean> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;

      const data = await res.json();
      setTokens(data.token, data.refreshToken);
      scheduleRefresh(data.token);
      return true;
    } catch {
      return false;
    }
  };

  const scheduleRefresh = (token: string) => {
    clearRefreshTimer();
    const payload = decodeToken(token);
    if (!payload?.exp) return;

    const expiresAtMs = payload.exp * 1000;
    const delay = Math.max(expiresAtMs - Date.now() - REFRESH_MARGIN_MS, 0);

    refreshTimeoutRef.current = setTimeout(() => {
      silentRefresh();
    }, delay);
  };

  const resetInactivityTimers = () => {
    setShowInactivityWarning(false);
    clearInactivityTimers();

    inactivityWarningRef.current = setTimeout(() => {
      setShowInactivityWarning(true);
    }, INACTIVITY_WARNING_MS);

    inactivityLogoutRef.current = setTimeout(() => {
      logoutPorInactividad();
    }, INACTIVITY_LOGOUT_MS);
  };

  // Verificar si hay un usuario logueado al cargar
  useEffect(() => {
    const token = getAccessToken();
    const userData = localStorage.getItem("user");

    if (token && userData) {
      if (isTokenExpired(token)) {
        clearTokens();
        sessionStorage.setItem("session_expired", "true");
        setUser(null);
      } else {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          scheduleRefresh(token);

          // Sincronizar con el backend para actualizar rol (si cambió)
          fetch(`${API_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data?.user) {
              const updatedUser = { ...parsedUser, ...data.user };
              localStorage.setItem("user", JSON.stringify(updatedUser));
              setUser(updatedUser);
            }
          })
          .catch(err => console.error("Error al sincronizar perfil:", err));

        } catch (error) {
          console.error("Error parsing user data:", error);
          clearTokens();
        }
      }
    }

    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer de inactividad: solo corre mientras haya sesión activa.
  useEffect(() => {
    if (!user) {
      clearInactivityTimers();
      setShowInactivityWarning(false);
      return;
    }

    resetInactivityTimers();

    const handleActivity = () => resetInactivityTimers();
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, handleActivity));

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, handleActivity));
      clearInactivityTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const login = (token: string, refreshToken: string | null | undefined, userData: User) => {
    setTokens(token, refreshToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    scheduleRefresh(token);
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  const finalizarLogout = (redirectTo: string) => {
    setIsLoggingOut(true);
    clearRefreshTimer();
    clearInactivityTimers();
    setTimeout(() => {
      clearTokens();
      setUser(null);
      window.location.href = redirectTo;
    }, LOGOUT_DELAY_MS);
  };

  const logout = () => {
    // Avisarle al backend que revoque el refresh token; si falla, igual cerramos localmente.
    const token = getAccessToken();
    if (token) {
      fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    finalizarLogout("/");
  };

  const logoutPorInactividad = () => {
    const token = getAccessToken();
    if (token) {
      fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    sessionStorage.setItem("session_expired", "inactivity");
    finalizarLogout("/login");
  };

  const stayConnected = () => {
    resetInactivityTimers();
  };

  const handleSessionExpired = () => {
    clearTokens();
    clearRefreshTimer();
    clearInactivityTimers();
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
        showInactivityWarning,
        login,
        logout,
        handleSessionExpired,
        updateUser,
        stayConnected,
      }}
    >
      {children}
      {showInactivityWarning && !isLoggingOut && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          role="alertdialog"
          aria-live="assertive"
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
            <p className="font-bold text-gray-800 mb-2">¿Seguís ahí?</p>
            <p className="text-sm text-gray-600 mb-5">
              Tu sesión se va a cerrar en unos minutos por inactividad.
            </p>
            <button
              onClick={stayConnected}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
            >
              Seguir conectado
            </button>
          </div>
        </div>
      )}
      {isLoggingOut && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/95 backdrop-blur-sm"
          aria-live="polite"
          aria-label="Cerrando sesión"
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4" />
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
