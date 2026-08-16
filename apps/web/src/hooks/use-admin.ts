"use client";

import { useQuery } from "@tanstack/react-query";
import type { Sale, Service } from "@barber/types";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import type { AdminKpi, AdminSummary } from "@/mocks/types";

// Color de respaldo para servicios sin color configurado (mismo criterio que
// use-agenda.ts y services-view.tsx).
const DEFAULT_SERVICE_COLOR = "#24406B";
const WEEKDAY_PLURAL_LABELS = [
  "domingos",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábados",
];
// Debajo de este número de ventas en el mes, no hay señal suficiente para
// sugerir un patrón por día de la semana.
const MIN_SALES_FOR_SUGGESTION = 10;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function addDays(date: Date, amount: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function inRange(iso: string, start: Date, end: Date): boolean {
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t < end.getTime();
}

// Variación porcentual contra el período anterior. Si el período anterior
// fue 0, no hay base para calcular un %: se muestra "up" con 0% en vez de
// un Infinity/NaN engañoso.
function trendFor(current: number, previous: number): { deltaPct: number; trend: "up" | "down" } {
  if (previous === 0) {
    return { deltaPct: 0, trend: "up" };
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  return { deltaPct: Math.abs(pct), trend: pct >= 0 ? "up" : "down" };
}

// Últimas 6 semanas (lunes a domingo), la actual al final — mismo criterio
// de "semana en curso destacada" que el gráfico del Dashboard.
function buildWeeklyRevenue(sales: Sale[]): AdminSummary["weeklyRevenue"] {
  const currentWeekStart = startOfWeek(new Date());

  return Array.from({ length: 6 }, (_, i) => {
    const weekStart = addDays(currentWeekStart, -7 * (5 - i));
    const weekEnd = addDays(weekStart, 7);
    const value = sales
      .filter((s) => inRange(s.createdAt, weekStart, weekEnd))
      .reduce((sum, s) => sum + s.total, 0);
    return { label: `S${i + 1}`, value };
  });
}

function buildTopServices(
  salesThisMonth: Sale[],
  services: Service[],
): AdminSummary["topServices"] {
  const colorByServiceId = new Map(services.map((s) => [s.id, s.color]));
  const byService = new Map<string, { name: string; count: number; color: string }>();

  for (const sale of salesThisMonth) {
    for (const item of sale.items) {
      const existing = byService.get(item.serviceId);
      if (existing) {
        existing.count += 1;
      } else {
        byService.set(item.serviceId, {
          name: item.serviceName,
          count: 1,
          color: colorByServiceId.get(item.serviceId) ?? DEFAULT_SERVICE_COLOR,
        });
      }
    }
  }

  return [...byService.values()].sort((a, b) => b.count - a.count).slice(0, 4);
}

// Solo suman los items de servicios con commissionPercent configurado (null
// u omitido = ese servicio no genera comisión, se ignora).
function buildCommissions(salesThisMonth: Sale[], services: Service[]): AdminSummary["commissions"] {
  const commissionPercentByServiceId = new Map(services.map((s) => [s.id, s.commissionPercent]));
  const byEmployee = new Map<string, { employeeName: string; amount: number }>();

  for (const sale of salesThisMonth) {
    for (const item of sale.items) {
      const percent = commissionPercentByServiceId.get(item.serviceId);
      if (!percent) continue;

      const amount = item.price * (percent / 100);
      const existing = byEmployee.get(sale.employee.id);
      if (existing) {
        existing.amount += amount;
      } else {
        byEmployee.set(sale.employee.id, { employeeName: sale.employee.name, amount });
      }
    }
  }

  return [...byEmployee.entries()]
    .map(([employeeId, v]) => ({ employeeId, employeeName: v.employeeName, amount: v.amount }))
    .sort((a, b) => b.amount - a.amount);
}

// Detecta el día de la semana con menos ventas respecto al resto, para
// replicar la sugerencia del mockup ("los martes tienen 40% menos turnos...").
function buildSuggestion(salesThisMonth: Sale[]): string {
  if (salesThisMonth.length < MIN_SALES_FOR_SUGGESTION) {
    return "todavía no hay suficientes ventas este mes para detectar un patrón por día — volvé a revisar en unas semanas.";
  }

  const countByWeekday = Array(7).fill(0) as number[];
  for (const sale of salesThisMonth) {
    countByWeekday[new Date(sale.createdAt).getDay()] += 1;
  }

  const minIndex = countByWeekday.indexOf(Math.min(...countByWeekday));
  const others = countByWeekday.filter((_, i) => i !== minIndex);
  const avgOthers = others.reduce((sum, c) => sum + c, 0) / others.length;

  if (avgOthers === 0) {
    return "todavía no hay suficientes ventas este mes para detectar un patrón por día — volvé a revisar en unas semanas.";
  }

  const pct = Math.round((1 - countByWeekday[minIndex] / avgOthers) * 100);
  if (pct < 15) {
    return "las ventas están parejas durante toda la semana — no hay un día que destaque por debajo del resto.";
  }

  return `los ${WEEKDAY_PLURAL_LABELS[minIndex]} tienen ${pct}% menos turnos que el resto de la semana — considerá una promo para ese día.`;
}

export function useAdminSummary() {
  const { user } = useAuth();
  const canViewFinancials = user?.role === "owner";

  const { data: sales } = useQuery({
    queryKey: ["sales", "all"],
    queryFn: () => apiClient.sales.list(),
    enabled: canViewFinancials,
  });

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: () => apiClient.customers.list(),
    enabled: canViewFinancials,
  });

  const { data: appointments } = useQuery({
    queryKey: ["appointments", "all"],
    queryFn: () => apiClient.appointments.list(),
    enabled: canViewFinancials,
  });

  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: () => apiClient.services.list(),
    enabled: canViewFinancials,
  });

  const now = new Date();
  const monthStart = startOfMonth(now);
  const nextMonthStart = addMonths(monthStart, 1);
  const prevMonthStart = addMonths(monthStart, -1);

  const allSales = sales ?? [];
  const salesThisMonth = allSales.filter((s) => inRange(s.createdAt, monthStart, nextMonthStart));
  const salesLastMonth = allSales.filter((s) => inRange(s.createdAt, prevMonthStart, monthStart));

  const revenueThisMonth = salesThisMonth.reduce((sum, s) => sum + s.total, 0);
  const revenueLastMonth = salesLastMonth.reduce((sum, s) => sum + s.total, 0);
  const avgTicketThisMonth = salesThisMonth.length ? revenueThisMonth / salesThisMonth.length : 0;
  const avgTicketLastMonth = salesLastMonth.length ? revenueLastMonth / salesLastMonth.length : 0;

  const allAppointments = appointments ?? [];
  // "Completados" = turnos cuyo horario ya pasó (el schema no tiene un
  // estado explícito por turno, docs/DATABASE.md).
  const appointmentsThisMonth = allAppointments.filter(
    (a) => inRange(a.startAt, monthStart, nextMonthStart) && new Date(a.startAt) < now,
  ).length;
  const appointmentsLastMonth = allAppointments.filter((a) =>
    inRange(a.startAt, prevMonthStart, monthStart),
  ).length;

  const allCustomers = customers ?? [];
  const newCustomersThisMonth = allCustomers.filter((c) =>
    inRange(c.createdAt, monthStart, nextMonthStart),
  ).length;
  const newCustomersLastMonth = allCustomers.filter((c) =>
    inRange(c.createdAt, prevMonthStart, monthStart),
  ).length;

  const kpis: AdminKpi[] = [
    {
      label: "Ingresos del mes",
      value: formatCurrency(revenueThisMonth),
      ...trendFor(revenueThisMonth, revenueLastMonth),
    },
    {
      label: "Turnos completados",
      value: String(appointmentsThisMonth),
      ...trendFor(appointmentsThisMonth, appointmentsLastMonth),
    },
    {
      label: "Ticket promedio",
      value: formatCurrency(avgTicketThisMonth),
      ...trendFor(avgTicketThisMonth, avgTicketLastMonth),
    },
    {
      label: "Clientes nuevos",
      value: String(newCustomersThisMonth),
      ...trendFor(newCustomersThisMonth, newCustomersLastMonth),
    },
  ];

  const weeklyRevenue = buildWeeklyRevenue(allSales);
  const weeklyRevenueAverage = weeklyRevenue.length
    ? Math.round(weeklyRevenue.reduce((sum, w) => sum + w.value, 0) / weeklyRevenue.length)
    : 0;

  const summary: AdminSummary = {
    periodLabel: "Este mes",
    kpis,
    weeklyRevenue,
    weeklyRevenueAverage,
    topServices: buildTopServices(salesThisMonth, services ?? []),
    suggestion: buildSuggestion(salesThisMonth),
    commissions: buildCommissions(salesThisMonth, services ?? []),
  };

  return { summary };
}
