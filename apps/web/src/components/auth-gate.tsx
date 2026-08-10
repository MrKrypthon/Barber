"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";

// Protección de rutas del lado del cliente: suficiente para el MVP web-only
// (ADR-007). Si más adelante se necesita protección a nivel de servidor,
// esto se reemplaza por middleware con cookies en vez de localStorage.
export function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return null;
  }

  return <>{children}</>;
}
