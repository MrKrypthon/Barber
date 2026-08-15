"use client";

import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Card } from "@/components/card";
import { ChevronRightIcon, PlusIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { useEmployees } from "@/hooks/use-employees";

export function EmployeesView() {
  const { employees, isLoading, isError } = useEmployees();

  return (
    <div>
      <PageHeader
        title="Empleados"
        backHref="/config"
        action={
          <Link
            href="/config/empleados/nuevo"
            aria-label="Nuevo empleado"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-white active:brightness-95"
          >
            <PlusIcon className="h-6 w-6" />
          </Link>
        }
      />

      <Card className="p-0">
        {isLoading ? (
          <p className="py-6 text-center text-neutral-400 dark:text-neutral-500">Cargando empleados...</p>
        ) : isError ? (
          <p className="py-6 text-center text-secondary">No se pudieron cargar los empleados.</p>
        ) : employees.length === 0 ? (
          <p className="py-6 text-center text-neutral-400 dark:text-neutral-500">
            Todavía no agregaste empleados.
          </p>
        ) : (
          <ul className="grid md:grid-cols-2">
            {employees.map((e) => (
              <li key={e.id} className="border-b border-neutral-100 dark:border-neutral-800">
                <Link
                  href={`/config/empleados/${e.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  <Avatar name={e.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{e.name}</p>
                    <p className="truncate text-sm text-neutral-400 dark:text-neutral-500">{e.email}</p>
                  </div>
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
