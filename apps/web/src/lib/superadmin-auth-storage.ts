import type { AuthTokens } from "@barber/types";

// Claves de localStorage separadas de auth-storage.ts a propósito: una
// sesión de SuperAdmin y una de negocio deben poder coexistir en el mismo
// navegador (pestañas distintas) sin pisarse.
const ACCESS_TOKEN_KEY = "barber.superadmin.accessToken";
const REFRESH_TOKEN_KEY = "barber.superadmin.refreshToken";

export function getSuperAdminAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getSuperAdminRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setSuperAdminTokens(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearSuperAdminTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
