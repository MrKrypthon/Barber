import type { CashMovementType } from "@barber/types";
import { formatLongDate, formatTime, fromDateParam } from "./format";
import { DARK, MUTED, drawBarChart, drawMovementsTable, hexToRgbTuple } from "./pdf-draw";

export type CashClosingPdfInput = {
  businessName: string;
  primaryColor: string;
  secondaryColor: string;
  closedByName: string;
  // Día que cubre el corte (no necesariamente el mismo instante que
  // closedAt: closedAt es cuándo se apretó "cerrar", date es el día
  // calendario que se está cerrando).
  date: string;
  closedAt: string;
  income: number;
  expense: number;
  balance: number;
  movements: { type: CashMovementType; amount: number; description: string | null; createdAt: string }[];
};

// jsPDF es client-only (usa document/canvas internamente) — se carga con
// import dinámico para no meterlo en el bundle inicial ni romper el SSR.
export async function downloadCashClosingPdf(input: CashClosingPdfInput): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const primary = hexToRgbTuple(input.primaryColor);
  const secondary = hexToRgbTuple(input.secondaryColor);
  const marginX = 14;
  const rightEdge = 196;

  // Franja de color de marca arriba de todo, puro detalle visual.
  doc.setFillColor(...primary);
  doc.rect(0, 0, 210, 6, "F");

  let y = 22;
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(input.businessName, marginX, y);

  y += 8;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text(`Corte de caja — ${formatLongDate(fromDateParam(input.date))}`, marginX, y);

  y += 10;
  const chartTop = y;
  const chartHeight = 32;
  drawBarChart(doc, marginX, chartTop, rightEdge - marginX, chartHeight, [
    { label: "Ingresos", value: input.income, color: primary },
    { label: "Gastos", value: input.expense, color: secondary },
    { label: "Balance", value: input.balance, color: DARK },
  ]);

  y = chartTop + chartHeight + 18;
  doc.setDrawColor(220);
  doc.line(marginX, y, rightEdge, y);

  y += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("Movimientos manuales", marginX, y);
  y += 8;

  y = drawMovementsTable(
    doc,
    marginX,
    y,
    rightEdge - marginX,
    input.movements,
    primary,
    secondary,
    "Sin movimientos manuales este día.",
  );

  y += 10;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text(
    `Cerrado por ${input.closedByName} el ${formatLongDate(new Date(input.closedAt))} a las ${formatTime(input.closedAt)}`,
    marginX,
    y,
  );

  const fileDate = input.date.slice(0, 10);
  doc.save(`corte-de-caja-${fileDate}.pdf`);
}
