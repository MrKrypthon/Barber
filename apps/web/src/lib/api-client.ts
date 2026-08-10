import { createApiClient } from "@barber/api-client";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./auth-storage";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

// El AuthProvider registra este listener para reaccionar (limpiar el usuario
// en memoria y redirigir a /login) cuando una sesión expira a mitad de uso.
let onSessionExpiredListener: (() => void) | null = null;

export function setOnSessionExpired(listener: (() => void) | null): void {
  onSessionExpiredListener = listener;
}

export const apiClient = createApiClient({
  baseUrl,
  getAccessToken,
  getRefreshToken,
  onTokensRefreshed: setTokens,
  onSessionExpired: () => {
    clearTokens();
    onSessionExpiredListener?.();
  },
});
