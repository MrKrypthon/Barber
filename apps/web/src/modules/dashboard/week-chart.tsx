"use client";

import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { DashboardSummary } from "@/mocks/types";

// Gráfico semanal con barras CSS (sin librería de charts — CLAUDE.md §25).
export function WeekChart({ week, average }: { week: DashboardSummary["week"]; average: number }) {
  const max = Math.max(...week.map((d) => d.cash + d.transfer));
  const averagePct = Math.min(100, (average / max) * 100);

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm text-neutral-500">Ventas de la semana</span>
        <span className="text-xs text-neutral-400">Prom. {formatCurrency(average)}</span>
      </div>
      <div className="relative">
        <div
          className="absolute inset-x-0 border-t border-dashed border-neutral-300"
          style={{ bottom: `${averagePct}%` }}
        />
        <div className="flex h-32 items-end justify-between gap-2">
          {week.map((d, i) => {
            const cashPct = (d.cash / max) * 100;
            const transferPct = (d.transfer / max) * 100;
            return (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <div className="flex h-full w-full max-w-8 items-end justify-center gap-0.5">
                  <div
                    className="w-1/2 rounded-t bg-primary"
                    style={{ height: `${cashPct}%` }}
                    title={`Efectivo ${formatCurrency(d.cash)}`}
                  />
                  <div
                    className="w-1/2 rounded-t bg-secondary"
                    style={{ height: `${transferPct}%` }}
                    title={`Transferencia ${formatCurrency(d.transfer)}`}
                  />
                </div>
                <span className={cn("text-xs", i === week.length - 1 ? "font-bold" : "text-neutral-400")}>
                  {d.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex gap-4 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Efectivo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-secondary" /> Transferencia
        </span>
      </div>
    </div>
  );
}
