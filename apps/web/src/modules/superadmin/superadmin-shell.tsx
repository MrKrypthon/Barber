"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { useSuperAdminAuth } from "@/hooks/use-superadmin-auth";

// Shell mínimo y separado de AppShell (components/app-shell.tsx) a
// propósito: AppShell trae sidebar/bottom-nav con marca y datos del
// negocio, que acá no existen — este panel no pertenece a ningún tenant.
export function SuperAdminShell({ children }: { children: ReactNode }) {
  const { superAdmin, logout } = useSuperAdminAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/superadmin/login");
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900 md:px-8">
        <Link href="/superadmin">
          <p className="text-sm font-semibold">Panel de administración</p>
          {superAdmin ? (
            <p className="text-xs text-neutral-400 dark:text-neutral-500">{superAdmin.name}</p>
          ) : null}
        </Link>
        <button type="button" onClick={handleLogout} className="text-sm font-medium text-secondary">
          Cerrar sesión
        </button>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
