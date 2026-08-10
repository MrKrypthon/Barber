"use client";

import { useState } from "react";
import { Card } from "@/components/card";
import { Chip } from "@/components/chip";
import { PageHeader } from "@/components/page-header";
import { useSales, type SalesFilter } from "@/hooks/use-sales";
import { formatCurrency, formatTime } from "@/lib/format";

const FILTERS: { value: SalesFilter; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
];

export function SalesView() {
  const [filter, setFilter] = useState<SalesFilter>("today");
  const { sales } = useSales(filter);

  return (
    <div>
      <PageHeader title="Ventas" />

      <div className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <Chip key={f.value} selected={filter === f.value} onClick={() => setFilter(f.value)}>
            {f.label}
          </Chip>
        ))}
      </div>

      {sales.length === 0 ? (
        <Card>
          <p className="py-6 text-center text-neutral-400">No hay ventas en este período.</p>
        </Card>
      ) : (
        <Card className="divide-y divide-neutral-100 p-0">
          {sales.map((sale) => (
            <div key={sale.id} className="flex items-center gap-4 px-4 py-3.5">
              <span className="w-12 text-sm font-semibold text-secondary">
                {formatTime(sale.createdAt)}
              </span>
              <div className="flex-1">
                <p className="font-medium">{sale.customerName ?? "Cliente ocasional"}</p>
                <p className="text-sm text-neutral-400">{sale.serviceNames.join(" + ")}</p>
              </div>
              <span
                className={
                  sale.paymentMethod === "cash"
                    ? "h-2.5 w-2.5 rounded-full bg-primary"
                    : "h-2.5 w-2.5 rounded-full bg-secondary"
                }
                title={sale.paymentMethod === "cash" ? "Efectivo" : "Transferencia"}
              />
              <span className="font-bold">{formatCurrency(sale.total)}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
