"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useSuperAdminAuth } from "@/hooks/use-superadmin-auth";

export function SuperAdminAuthGate({ children }: { children: ReactNode }) {
  const { status } = useSuperAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/superadmin/login");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return null;
  }

  return <>{children}</>;
}
