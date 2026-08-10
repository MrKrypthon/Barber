import type { Sale } from "./types";

function todayAt(hours: number, minutes: number): string {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

function daysAgoAt(days: number, hours: number, minutes: number): string {
  const d = new Date(Date.now() - days * 86_400_000);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

// Coherente con mockDashboard/mockCash: hoy suma $50.500
// (Efectivo $32.000 + Transferencia $18.500).
export const mockSales: Sale[] = [
  { id: "v1", customerName: "Laura Gómez", serviceNames: ["Afeitado clásico"], paymentMethod: "transfer", total: 6500, createdAt: todayAt(9, 40) },
  { id: "v2", customerName: "Ana Silva", serviceNames: ["Corte Clásico"], paymentMethod: "cash", total: 8000, createdAt: todayAt(10, 2) },
  { id: "v3", customerName: "Rodrigo Paz", serviceNames: ["Barba"], paymentMethod: "cash", total: 5000, createdAt: todayAt(11, 34) },
  { id: "v4", customerName: null, serviceNames: ["Barba"], paymentMethod: "cash", total: 5000, createdAt: todayAt(12, 15) },
  { id: "v5", customerName: "Marcos Díaz", serviceNames: ["Corte + Barba"], paymentMethod: "transfer", total: 12000, createdAt: todayAt(14, 31) },
  { id: "v6", customerName: "Nico Fernández", serviceNames: ["Diseño"], paymentMethod: "cash", total: 6000, createdAt: todayAt(16, 5) },
  { id: "v7", customerName: "Juan Pérez", serviceNames: ["Corte Clásico"], paymentMethod: "cash", total: 8000, createdAt: todayAt(17, 20) },
  // Semana
  { id: "v8", customerName: "Ana Silva", serviceNames: ["Coloración"], paymentMethod: "transfer", total: 14000, createdAt: daysAgoAt(1, 12, 10) },
  { id: "v9", customerName: null, serviceNames: ["Corte Clásico"], paymentMethod: "cash", total: 8000, createdAt: daysAgoAt(2, 16, 45) },
  { id: "v10", customerName: "Rodrigo Paz", serviceNames: ["Corte Clásico", "Barba"], paymentMethod: "cash", total: 13000, createdAt: daysAgoAt(4, 11, 5) },
  // Mes
  { id: "v11", customerName: "Marcos Díaz", serviceNames: ["Corte Clásico"], paymentMethod: "cash", total: 8000, createdAt: daysAgoAt(12, 10, 30) },
  { id: "v12", customerName: "Laura Gómez", serviceNames: ["Coloración"], paymentMethod: "transfer", total: 14000, createdAt: daysAgoAt(20, 15, 0) },
];
