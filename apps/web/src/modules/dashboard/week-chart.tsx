"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { DashboardSummary } from "@/mocks/types";

// Gráfico semanal con barras CSS (sin librería de charts — CLAUDE.md §25).
// Las barras crecen desde 0 al montar (un solo momento animado, no motion
// continuo) y cada día muestra su total arriba de la barra.
export function WeekChart({ week, average }: { week: DashboardSummary["week"]; average: number }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const totals = week.map((d) => d.cash + d.transfer);
  const max = Math.max(...totals, 1);
  const weekTotal = totals.reduce((sum, t) => sum + t, 0);
  const peakIndex = totals.reduce((best, t, i) => (t > totals[best] ? i : best), 0);
  const averagePct = Math.min(100, (average / max) * 100);

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-sm text-neutral-500">Ventas de la semana</span>
        <span className="text-lg font-bold">{formatCurrency(weekTotal)}</span>
      </div>
      <div className="relative">
        <div
          className="absolute inset-x-0 border-t border-dashed border-neutral-300"
          style={{ bottom: `${averagePct}%` }}
        />
        <div className="flex h-36 items-end justify-between gap-2">
          {week.map((d, i) => {
            const total = d.cash + d.transfer;
            const isPeak = i === peakIndex && total > 0;
            const delay = `${i * 60}ms`;
            return (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span
                  className={cn(
                    "text-[10px] font-semibold text-neutral-400 transition-opacity duration-300",
                    mounted ? "opacity-100" : "opacity-0",
                    isPeak && "text-primary",
                  )}
                  style={{ transitionDelay: delay }}
                >
                  {total > 0 ? formatCurrency(total) : ""}
                </span>
                <div className="flex h-full w-full max-w-8 items-end justify-center gap-0.5">
                  <div
                    className="w-1/2 rounded-t bg-primary transition-[height] duration-500 ease-out"
                    style={{
                      height: mounted ? `${(d.cash / max) * 100}%` : "0%",
                      transitionDelay: delay,
                    }}
                    title={`Efectivo ${formatCurrency(d.cash)}`}
                  />
                  <div
                    className="w-1/2 rounded-t bg-secondary transition-[height] duration-500 ease-out"
                    style={{
                      height: mounted ? `${(d.transfer / max) * 100}%` : "0%",
                      transitionDelay: delay,
                    }}
                    title={`Transferencia ${formatCurrency(d.transfer)}`}
                  />
                </div>
                <span
                  className={cn(
                    "text-xs",
                    isPeak ? "font-bold text-primary" : i === week.length - 1 ? "font-bold" : "text-neutral-400",
                  )}
                >
                  {d.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Efectivo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-secondary" /> Transferencia
          </span>
        </div>
        <span>Prom. {formatCurrency(average)}/día</span>
      </div>
    </div>
  );
}
