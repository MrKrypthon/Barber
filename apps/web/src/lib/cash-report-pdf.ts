import { formatCurrency, formatLongDate, fromDateParam } from "./format";
import {
  DARK,
  MUTED,
  drawBarChart,
  drawMovementsTable,
  hexToRgbTuple,
  movementsTableHeight,
  type PdfMovement,
} from "./pdf-draw";

export type CashReportPdfDay = {
  date: string;
  income: number;
  expense: number;
  balance: number;
  movements: PdfMovement[];
};

export type CashReportPdfInput = {
  businessName: string;
  primaryColor: string;
  secondaryColor: string;
  from: string;
  to: string;
  income: number;
  expense: number;
  balance: number;
  days: CashReportPdfDay[];
};

const PAGE_BOTTOM = 283;
const MARGIN_X = 14;
const RIGHT_EDGE = 196;

// jsPDF es client-only — mismo criterio que downloadCashClosingPdf (import
// dinámico, sin meterlo en el bundle inicial ni romper el SSR).
export async function downloadCashReportPdf(input: CashReportPdfInput): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const primary = hexToRgbTuple(input.primaryColor);
  const secondary = hexToRgbTuple(input.secondaryColor);

  doc.setFillColor(...primary);
  doc.rect(0, 0, 210, 6, "F");

  let y = 22;
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(input.businessName, MARGIN_X, y);

  y += 8;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text(
    `Reporte de caja — ${formatLongDate(fromDateParam(input.from))} al ${formatLongDate(fromDateParam(input.to))}`,
    MARGIN_X,
    y,
  );

  y += 10;
  const chartTop = y;
  const chartHeight = 32;
  drawBarChart(doc, MARGIN_X, chartTop, RIGHT_EDGE - MARGIN_X, chartHeight, [
    { label: "Ingresos", value: input.income, color: primary },
    { label: "Gastos", value: input.expense, color: secondary },
    { label: "Balance", value: input.balance, color: DARK },
  ]);

  y = chartTop + chartHeight + 18;
  doc.setDrawColor(220);
  doc.line(MARGIN_X, y, RIGHT_EDGE, y);
  y += 10;

  // Solo se listan los días con actividad — un mes entero con la mayoría
  // de los días en cero solo agregaría hojas vacías sin aportar nada.
  const activeDays = input.days.filter(
    (day) => day.income !== 0 || day.expense !== 0 || day.movements.length > 0,
  );

  if (activeDays.length === 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text("Sin movimientos en este rango.", MARGIN_X, y);
  } else {
    activeDays.forEach((day) => {
      // Encabezado del día (12) + tabla + espacio (10) — si no entra en lo
      // que queda de la hoja, se pasa a una nueva antes de dibujar nada de
      // este día (jsPDF no reflowea solo, hay que decidirlo a mano).
      const needed = 12 + movementsTableHeight(day.movements) + 10;
      if (y + needed > PAGE_BOTTOM) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...DARK);
      doc.text(formatLongDate(fromDateParam(day.date)), MARGIN_X, y);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTED);
      doc.text(
        `Ingresos ${formatCurrency(day.income)} · Gastos ${formatCurrency(day.expense)} · Balance ${formatCurrency(day.balance)}`,
        RIGHT_EDGE,
        y,
        { align: "right" },
      );
      y += 7;

      y = drawMovementsTable(
        doc,
        MARGIN_X,
        y,
        RIGHT_EDGE - MARGIN_X,
        day.movements,
        primary,
        secondary,
        "Sin movimientos manuales este día.",
      );
      y += 10;
    });
  }

  doc.save(`reporte-de-caja-${input.from}_${input.to}.pdf`);
}
