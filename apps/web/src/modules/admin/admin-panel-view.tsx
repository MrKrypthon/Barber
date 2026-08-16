"use client";

import { Avatar } from "@/components/avatar";
import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { useAdminSummary } from "@/hooks/use-admin";
import { cn } from "@/lib/cn";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";

export function AdminPanelView() {
  const { summary } = useAdminSummary();
  // || 1 evita división por cero cuando el negocio todavía no tiene ventas.
  const maxRevenue = Math.max(...summary.weeklyRevenue.map((w) => w.value)) || 1;
  const maxCount = Math.max(...summary.topServices.map((s) => s.count)) || 1;
  const maxCommission = Math.max(...summary.commissions.map((c) => c.amount)) || 1;
  const averagePct = Math.min(100, (summary.weeklyRevenueAverage / maxRevenue) * 100);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Panel del administrador"
        action={
          <span className="rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
            {summary.periodLabel}
          </span>
        }
      />

      {/* KPIs (mockup pág. 9) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.kpis.map((kpi) => (
          <Card key={kpi.label} className="flex flex-col gap-1">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">{kpi.label}</span>
            <span className="text-2xl font-bold">{kpi.value}</span>
            <span
              className={cn(
                "text-xs font-medium",
                kpi.trend === "up" ? "text-success" : "text-secondary",
              )}
            >
              {kpi.trend === "up" ? "↑" : "↓"} {kpi.deltaPct}% vs. mes anterior
            </span>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        {/* Ingresos — últimas 6 semanas */}
        <Card>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-semibold">Ingresos — últimas 6 semanas</h2>
            <span className="text-xs text-neutral-400 dark:text-neutral-500">
              Prom. {formatCompactCurrency(summary.weeklyRevenueAverage)}
            </span>
          </div>
          <div className="relative">
            <div
              className="absolute inset-x-0 border-t border-dashed border-neutral-300 dark:border-neutral-700"
              style={{ bottom: `${averagePct}%` }}
            />
            <div className="flex h-44 items-end justify-between gap-3">
              {summary.weeklyRevenue.map((w, i) => {
                const isLast = i === summary.weeklyRevenue.length - 1;
                return (
                  <div key={w.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                    <span className="text-xs text-neutral-400 dark:text-neutral-500">
                      {formatCompactCurrency(w.value)}
                    </span>
                    <div
                      className={cn("w-full max-w-12 rounded-t-lg", isLast ? "bg-primary" : "bg-primary/25")}
                      style={{ height: `${(w.value / maxRevenue) * 100}%` }}
                    />
                    <span
                      className={cn("text-xs", isLast ? "font-bold" : "text-neutral-400 dark:text-neutral-500")}
                    >
                      {w.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Servicios más vendidos */}
        <Card>
          <h2 className="mb-4 font-semibold">Servicios más vendidos</h2>
          <ul className="flex flex-col gap-4">
            {summary.topServices.map((s) => (
              <li key={s.name}>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-sm font-medium">{s.name}</span>
                  <span className="text-sm text-neutral-400 dark:text-neutral-500">{s.count}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${(s.count / maxCount) * 100}%`, backgroundColor: s.color }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Comisiones — solo suma servicios con % de comisión configurado
          (Configuración → Servicios). */}
      <Card>
        <h2 className="mb-4 font-semibold">Comisiones — este mes</h2>
        {summary.commissions.length === 0 ? (
          <p className="text-sm text-neutral-400 dark:text-neutral-500">
            Todavía no hay comisiones este mes. Configurá un % de comisión en algún servicio para
            que empiece a calcularse acá.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {summary.commissions.map((c) => (
              <li key={c.employeeId}>
                <div className="mb-1 flex items-center gap-3">
                  <Avatar name={c.employeeName} className="h-8 w-8 shrink-0 text-xs" />
                  <span className="flex-1 text-sm font-medium">{c.employeeName}</span>
                  <span className="text-sm font-semibold">{formatCurrency(c.amount)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${(c.amount / maxCommission) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Banner de sugerencia */}
      <div className="flex items-start gap-3 rounded-2xl bg-secondary-light p-4">
        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-secondary" />
        <p className="text-sm text-neutral-700">
          <strong>Sugerencia:</strong> {summary.suggestion}
        </p>
      </div>
    </div>
  );
}
