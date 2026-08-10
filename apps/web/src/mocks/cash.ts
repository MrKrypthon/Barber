import type { CashMovement } from "./types";
import { mockSales } from "./sales";

function todayAt(hours: number, minutes: number): string {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

const today = new Date();
const isToday = (iso: string) => {
  const d = new Date(iso);
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
};

// Movimientos de hoy = ventas del día + un gasto manual (docs/PROJECT.md §Caja).
const saleMovements: CashMovement[] = mockSales
  .filter((s) => isToday(s.createdAt))
  .map((s) => ({
    id: `m-${s.id}`,
    type: "income",
    amount: s.total,
    description: s.customerName ?? "Cliente ocasional",
    paymentMethod: s.paymentMethod,
    createdAt: s.createdAt,
  }));

const expenseMovement: CashMovement = {
  id: "m-gasto-1",
  type: "expense",
  amount: 3000,
  description: "Compra de cuchillas",
  paymentMethod: "cash",
  createdAt: todayAt(13, 20),
};

export const mockCashMovements: CashMovement[] = [...saleMovements, expenseMovement].sort(
  (a, b) => a.createdAt.localeCompare(b.createdAt),
);

export const mockCashSummary = {
  cashTotal: 32000,
  transferTotal: 18500,
  get total() {
    return this.cashTotal + this.transferTotal;
  },
};
