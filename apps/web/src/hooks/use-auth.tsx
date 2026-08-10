"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { PublicUser } from "@barber/types";
import { ApiError } from "@barber/api-client";
import { apiClient, setOnSessionExpired } from "@/lib/api-client";
import { clearTokens, getAccessToken, setTokens } from "@/lib/auth-storage";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type RegisterInput = {
  businessName: string;
  ownerName: string;
  email: string;
  password: string;
};

type AuthContextValue = {
  user: PublicUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    setOnSessionExpired(() => {
      setUser(null);
      setStatus("unauthenticated");
    });
    return () => setOnSessionExpired(null);
  }, []);

  useEffect(() => {
    if (!getAccessToken()) {
      setStatus("unauthenticated");
      return;
    }
    apiClient.auth
      .me()
      .then((me) => {
        setUser(me);
        setStatus("authenticated");
      })
      .catch(() => {
        clearTokens();
        setStatus("unauthenticated");
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiClient.auth.login({ email, password });
    setTokens(result);
    setUser(result.user);
    setStatus("authenticated");
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const result = await apiClient.auth.register(input);
    setTokens(result);
    setUser(result.user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.auth.logout();
    } catch {
      // Si el logout en el servidor falla (p.ej. sesión ya expirada), la
      // sesión local se limpia de todos modos.
    }
    clearTokens();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Ocurrió un error inesperado. Intenta de nuevo.";
}
