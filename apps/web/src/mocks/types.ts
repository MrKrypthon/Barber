// Tipos del lado de la vista. Espejan docs/DATABASE.md y los DTOs del API
// (apps/api/src/**/dto). Cuando el backend esté listo, estos tipos se
// reemplazan/alinean con packages/types.

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  // Derivado de ventas/turnos; no existe como columna (se calcula).
  lastVisitAt: string | null;
};

export type Service = {
  id: string;
  name: string;
  price: number;
  active: boolean;
  // Pendientes en schema.prisma: los mockups los usan (duración y color por
  // servicio). Ver nota de alineación con backend en el plan de Fase Web-1.
  durationMinutes?: number;
  color?: string;
};

export type PaymentMethod = "cash" | "transfer";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
};

export type Sale = {
  id: string;
  // null = "cliente ocasional" (sales.customer_id es nullable, docs/DATABASE.md).
  customerName: string | null;
  serviceNames: string[];
  paymentMethod: PaymentMethod;
  total: number;
  createdAt: string; // ISO
};

export type CashMovement = {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  paymentMethod: PaymentMethod | null;
  createdAt: string; // ISO
};

export type DashboardSummary = {
  todaySalesTotal: number;
  todaySalesCount: number;
  // Los turnos dependen del módulo Agenda (v0.2, docs/ROADMAP.md) — datos mock.
  appointmentsToday: number;
  nextAppointmentTime: string | null;
  cashTotal: number;
  transferTotal: number;
  week: { dayLabel: string; cash: number; transfer: number }[];
  weekAverage: number;
  todayAppointments: { time: string; customerName: string; serviceName: string }[];
};

// --- v0.2 (docs/ROADMAP.md) — vistas maquetadas con datos mock ---

// Agenda (mockup pág. 6 de docs/Propuesta.pdf). color replica service.color.
export type Appointment = {
  id: string;
  customerName: string;
  serviceName: string;
  startTime: string; // "HH:MM"
  durationMinutes: number;
  color: string;
};

// Panel del administrador (mockup pág. 9) — vista exclusiva del owner.
export type AdminKpi = {
  label: string;
  value: string;
  deltaPct: number;
  trend: "up" | "down";
};

export type AdminSummary = {
  periodLabel: string;
  kpis: AdminKpi[];
  weeklyRevenue: { label: string; value: number }[];
  weeklyRevenueAverage: number;
  topServices: { name: string; count: number; color: string }[];
  suggestion: string;
};
