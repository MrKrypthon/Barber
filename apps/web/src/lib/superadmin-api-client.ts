import { createSuperAdminApiClient } from "@barber/api-client";
import {
  clearSuperAdminTokens,
  getSuperAdminAccessToken,
  getSuperAdminRefreshToken,
  setSuperAdminTokens,
} from "./superadmin-auth-storage";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

let onSessionExpiredListener: (() => void) | null = null;

export function setOnSuperAdminSessionExpired(listener: (() => void) | null): void {
  onSessionExpiredListener = listener;
}

export const superAdminApiClient = createSuperAdminApiClient({
  baseUrl,
  getAccessToken: getSuperAdminAccessToken,
  getRefreshToken: getSuperAdminRefreshToken,
  onTokensRefreshed: setSuperAdminTokens,
  onSessionExpired: () => {
    clearSuperAdminTokens();
    onSessionExpiredListener?.();
  },
  refreshPath: "/superadmin/auth/refresh",
});
