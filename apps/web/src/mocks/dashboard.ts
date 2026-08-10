import type { DashboardSummary } from "./types";

const DAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"];

function dayLabel(offset: number): string {
  const d = new Date(Date.now() - offset * 86_400_000);
  return DAY_LABELS[d.getDay()];
}

// Los valores de hoy (última posición) son coherentes con mockSales/mockCash.
export const mockDashboard: DashboardSummary = {
  todaySalesTotal: 50500,
  todaySalesCount: 7,
  appointmentsToday: 6,
  nextAppointmentTime: "14:30",
  cashTotal: 32000,
  transferTotal: 18500,
  week: [
    { dayLabel: dayLabel(6), cash: 28000, transfer: 12000 },
    { dayLabel: dayLabel(5), cash: 34000, transfer: 15000 },
    { dayLabel: dayLabel(4), cash: 26000, transfer: 11000 },
    { dayLabel: dayLabel(3), cash: 38000, transfer: 16000 },
    { dayLabel: dayLabel(2), cash: 30000, transfer: 14000 },
    { dayLabel: dayLabel(1), cash: 36000, transfer: 17500 },
    { dayLabel: dayLabel(0), cash: 32000, transfer: 18500 },
  ],
  weekAverage: 43700,
  todayAppointments: [
    { time: "10:00", customerName: "Ana Silva", serviceName: "Corte Clásico" },
    { time: "11:30", customerName: "Rodrigo Paz", serviceName: "Barba" },
    { time: "14:30", customerName: "Marcos Díaz", serviceName: "Corte + Barba" },
    { time: "16:00", customerName: "Nico Fernández", serviceName: "Diseño" },
  ],
};
