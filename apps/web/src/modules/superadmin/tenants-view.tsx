"use client";

import Link from "next/link";
import { Card } from "@/components/card";
import { ChevronRightIcon } from "@/components/icons";
import { useSuperAdminTenants } from "@/hooks/use-superadmin-tenants";
import { formatLongDate } from "@/lib/format";
import { SubscriptionStatusBadge } from "./subscription-status-badge";

export function TenantsView() {
  const { tenants, activeCount, isLoading, isError } = useSuperAdminTenants();

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">Negocios</h1>
      <p className="mb-5 text-sm text-neutral-500 dark:text-neutral-400">
        {isLoading ? "Cargando..." : `${activeCount} de ${tenants.length} negocios con la suscripción al día`}
      </p>

      {isLoading ? (
        <Card>
          <p className="py-6 text-center text-neutral-400 dark:text-neutral-500">Cargando negocios...</p>
        </Card>
      ) : isError ? (
        <Card>
          <p className="py-6 text-center text-secondary">No se pudieron cargar los negocios.</p>
        </Card>
      ) : tenants.length === 0 ? (
        <Card>
          <p className="py-6 text-center text-neutral-400 dark:text-neutral-500">
            Todavía no hay negocios registrados.
          </p>
        </Card>
      ) : (
        <Card className="divide-y divide-neutral-100 p-0 dark:divide-neutral-800">
          {tenants.map((t) => (
            <Link
              key={t.id}
              href={`/superadmin/negocios/${t.id}`}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{t.name}</p>
                <p className="truncate text-sm text-neutral-400 dark:text-neutral-500">
                  {t.ownerName ?? "Sin dueño"} · alta {formatLongDate(new Date(t.createdAt))}
                </p>
              </div>
              <SubscriptionStatusBadge status={t.subscriptionStatus} />
              <ChevronRightIcon className="h-5 w-5 text-neutral-300 dark:text-neutral-600" />
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
