import type { AdminSummary } from "./types";

// Replica el mockup "Panel del administrador" (pág. 9 de docs/Propuesta.pdf).
// Vista exclusiva del owner; vendrá de endpoints de estadísticas (v0.2).
export const mockAdminSummary: AdminSummary = {
  periodLabel: "Últimos 30 días",
  kpis: [
    { label: "Ingresos del mes", value: "$612.400", deltaPct: 12, trend: "up" },
    { label: "Turnos completados", value: "184", deltaPct: 8, trend: "up" },
    { label: "Ticket promedio", value: "$8.850", deltaPct: 3, trend: "down" },
    { label: "Clientes nuevos", value: "23", deltaPct: 15, trend: "up" },
  ],
  weeklyRevenue: [
    { label: "S1", value: 98000 },
    { label: "S2", value: 112000 },
    { label: "S3", value: 87000 },
    { label: "S4", value: 134000 },
    { label: "S5", value: 121000 },
    { label: "S6", value: 145000 },
  ],
  weeklyRevenueAverage: 116000,
  topServices: [
    { name: "Corte Clásico", count: 62, color: "#24406B" },
    { name: "Corte + Barba", count: 41, color: "#C0392B" },
    { name: "Barba", count: 28, color: "#24406B" },
    { name: "Diseño", count: 15, color: "#C0392B" },
  ],
  suggestion:
    "los martes tienen 40% menos turnos que el resto de la semana — considerá una promo para ese día.",
};
