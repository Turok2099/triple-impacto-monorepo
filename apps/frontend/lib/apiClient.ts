/**
 * Cliente fetch autenticado compartido por los módulos de lib/.
 * Centraliza: adjuntar el access token vigente y, si el backend responde 401,
 * intentar renovarlo una vez con el refresh token antes de forzar un logout.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export const ACCESS_TOKEN_KEY = "auth_token";
export const REFRESH_TOKEN_KEY = "refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(token: string, refreshToken?: string | null): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("user");
}

// Deduplica llamadas a /auth/refresh simultáneas (varios requests en paralelo
// que reciben 401 al mismo tiempo no deben disparar N refreshes).
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return null;

      const data = await res.json();
      setTokens(data.token, data.refreshToken);
      return data.token as string;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function redirectToSessionExpired(): void {
  clearTokens();
  sessionStorage.setItem("session_expired", "true");
  window.location.href = "/login";
}

/**
 * fetch autenticado: siempre usa el access token más reciente de localStorage
 * (no uno pasado por parámetro, que puede haber quedado viejo) y, ante un 401,
 * intenta renovar la sesión una sola vez antes de redirigir a /login.
 */
export async function fetchWithAuth(
  input: string,
  options: RequestInit = {},
): Promise<Response> {
  const doFetch = (token: string | null) => {
    const headers = new Headers(options.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(input, { ...options, headers });
  };

  let res = await doFetch(getAccessToken());

  if (res.status === 401 && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doFetch(newToken);
    } else {
      redirectToSessionExpired();
    }
  }

  return res;
}
