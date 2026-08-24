"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { PublicSuperAdmin } from "@barber/types";
import { ApiError } from "@barber/api-client";
import { setOnSuperAdminSessionExpired, superAdminApiClient } from "@/lib/superadmin-api-client";
import {
  clearSuperAdminTokens,
  getSuperAdminAccessToken,
  setSuperAdminTokens,
} from "@/lib/superadmin-auth-storage";

type SuperAdminAuthStatus = "loading" | "authenticated" | "unauthenticated";

type SuperAdminAuthContextValue = {
  superAdmin: PublicSuperAdmin | null;
  status: SuperAdminAuthStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const SuperAdminAuthContext = createContext<SuperAdminAuthContextValue | null>(null);

// Sin /register acá: no hay alta propia (superadmin-auth.controller.ts), la
// única cuenta se crea con el script de seed.
export function SuperAdminAuthProvider({ children }: { children: ReactNode }) {
  const [superAdmin, setSuperAdmin] = useState<PublicSuperAdmin | null>(null);
  const [status, setStatus] = useState<SuperAdminAuthStatus>("loading");

  useEffect(() => {
    setOnSuperAdminSessionExpired(() => {
      setSuperAdmin(null);
      setStatus("unauthenticated");
    });
    return () => setOnSuperAdminSessionExpired(null);
  }, []);

  useEffect(() => {
    if (!getSuperAdminAccessToken()) {
      setStatus("unauthenticated");
      return;
    }
    superAdminApiClient.auth
      .me()
      .then((me) => {
        setSuperAdmin(me);
        setStatus("authenticated");
      })
      .catch(() => {
        clearSuperAdminTokens();
        setStatus("unauthenticated");
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await superAdminApiClient.auth.login({ email, password });
    setSuperAdminTokens(result);
    setSuperAdmin(result.superAdmin);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await superAdminApiClient.auth.logout();
    } catch {
      // Sesión local se limpia igual aunque el logout en el servidor falle.
    }
    clearSuperAdminTokens();
    setSuperAdmin(null);
    setStatus("unauthenticated");
  }, []);

  return (
    <SuperAdminAuthContext.Provider value={{ superAdmin, status, login, logout }}>
      {children}
    </SuperAdminAuthContext.Provider>
  );
}

export function useSuperAdminAuth(): SuperAdminAuthContextValue {
  const ctx = useContext(SuperAdminAuthContext);
  if (!ctx) {
    throw new Error("useSuperAdminAuth debe usarse dentro de <SuperAdminAuthProvider>");
  }
  return ctx;
}

export function getSuperAdminAuthErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Ocurrió un error inesperado. Intenta de nuevo.";
}
