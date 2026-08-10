import type { AuthTokens } from "@barber/types";

const ACCESS_TOKEN_KEY = "barber.accessToken";
const REFRESH_TOKEN_KEY = "barber.refreshToken";

// localStorage no existe en SSR; todo lo que lo toca corre solo en cliente
// (hooks/componentes "use client" ejecutados después del mount).
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
