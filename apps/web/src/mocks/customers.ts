import type { Customer } from "./types";

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

export const mockCustomers: Customer[] = [
  { id: "c1", name: "Juan Pérez", phone: "5491100000001", notes: null, lastVisitAt: daysAgo(2) },
  { id: "c2", name: "Marcos Díaz", phone: "5491100000002", notes: null, lastVisitAt: daysAgo(5) },
  { id: "c3", name: "Nico Fernández", phone: null, notes: null, lastVisitAt: daysAgo(0) },
  { id: "c4", name: "Ana Silva", phone: "5491100000004", notes: null, lastVisitAt: daysAgo(7) },
  { id: "c5", name: "Rodrigo Paz", phone: null, notes: "Prefiere navaja", lastVisitAt: daysAgo(3) },
  { id: "c6", name: "Laura Gómez", phone: null, notes: null, lastVisitAt: daysAgo(14) },
];
