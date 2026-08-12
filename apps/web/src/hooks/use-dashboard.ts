"use client";

import { useQuery } from "@tanstack/react-query";
import type { Sale } from "@barber/types";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { formatTime } from "@/lib/format";
import type { DashboardSummary } from "@/mocks/types";

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function sumByPaymentMethod(sales: Sale[], method: "cash" | "transfer"): number {
  return sales.filter((s) => s.paymentMethod === method).reduce((sum, s) => sum + s.total, 0);
}

// Serie de 7 días (lunes a domingo de la semana actual) a partir de las
// ventas de la semana — /cash solo da un total agregado del rango, no un
// desglose por día, por eso se calcula acá con los datos de /sales.
function buildWeekSeries(sales: Sale[]): DashboardSummary["week"] {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const daySales = sales.filter((s) => isSameDay(new Date(s.createdAt), date));
    return {
      dayLabel: DAY_LABELS[i],
      cash: sumByPaymentMethod(daySales, "cash"),
      transfer: sumByPaymentMethod(daySales, "transfer"),
    };
  });
}

function averageWeek(week: DashboardSummary["week"]): number {
  const total = week.reduce((sum, d) => sum + d.cash + d.transfer, 0);
  return Math.round(total / week.length);
}

export function useDashboard() {
  const { user } = useAuth();
  const canViewFinancials = user?.role === "owner";

  const { data: appointments } = useQuery({
    queryKey: ["appointments", "today"],
    queryFn: () => apiClient.appointments.list({ range: "today" }),
  });

  const { data: salesToday } = useQuery({
    queryKey: ["sales", "today"],
    queryFn: () => apiClient.sales.list("today"),
    enabled: canViewFinancials,
  });

  const { data: salesWeek } = useQuery({
    queryKey: ["sales", "week"],
    queryFn: () => apiClient.sales.list("week"),
    enabled: canViewFinancials,
  });

  const { data: cashToday } = useQuery({
    queryKey: ["cash", "today"],
    queryFn: () => apiClient.cash.getSummary("today"),
    enabled: canViewFinancials,
  });

  const sortedAppointments = [...(appointments ?? [])].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );
  const now = Date.now();
  const nextAppointment = sortedAppointments.find((a) => new Date(a.startAt).getTime() > now);
  const week = salesWeek ? buildWeekSeries(salesWeek) : [];

  const summary: DashboardSummary = {
    canViewFinancials,
    todaySalesTotal: salesToday?.reduce((sum, s) => sum + s.total, 0) ?? 0,
    todaySalesCount: salesToday?.length ?? 0,
    appointmentsToday: sortedAppointments.length,
    nextAppointmentTime: nextAppointment ? formatTime(nextAppointment.startAt) : null,
    cashTotal: cashToday?.balance ?? 0,
    transferTotal: salesToday ? sumByPaymentMethod(salesToday, "transfer") : 0,
    week,
    weekAverage: week.length ? averageWeek(week) : 0,
    todayAppointments: sortedAppointments.map((a) => ({
      time: formatTime(a.startAt),
      customerName: a.customer.name,
      serviceName: a.service.name,
    })),
  };

  return { summary };
}
