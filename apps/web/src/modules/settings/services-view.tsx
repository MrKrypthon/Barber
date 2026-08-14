"use client";

import Link from "next/link";
import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { ChevronRightIcon, PlusIcon } from "@/components/icons";
import { useServices } from "@/hooks/use-services";
import { formatCurrency } from "@/lib/format";

export function ServicesView() {
  const { services, isLoading, isError } = useServices();

  return (
    <div>
      <PageHeader
        title="Servicios"
        backHref="/config"
        action={
          <Link
            href="/config/servicios/nuevo"
            aria-label="Nuevo servicio"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-white active:brightness-95"
          >
            <PlusIcon className="h-6 w-6" />
          </Link>
        }
      />

      <Card className="p-0">
        {isLoading ? (
          <p className="py-6 text-center text-neutral-400 dark:text-neutral-500">Cargando servicios...</p>
        ) : isError ? (
          <p className="py-6 text-center text-secondary">No se pudieron cargar los servicios.</p>
        ) : (
          <ul className="grid md:grid-cols-2">
            {services.map((s) => (
              <li key={s.id} className="border-b border-neutral-100 dark:border-neutral-800">
                <Link
                  href={`/config/servicios/${s.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  <span
                    className="h-10 w-1.5 rounded-full"
                    style={{ backgroundColor: s.color ?? "#24406B" }}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{s.name}</p>
                    {s.durationMinutes ? (
                      <p className="text-sm text-neutral-400 dark:text-neutral-500">{s.durationMinutes} min</p>
                    ) : null}
                  </div>
                  <span className="font-bold">{formatCurrency(s.price)}</span>
                  <ChevronRightIcon className="h-5 w-5 text-neutral-300 dark:text-neutral-600" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
