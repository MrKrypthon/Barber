import type { CashMovementType } from "@barber/types";
import { hexToRgbTriplet } from "./color";
import { formatCurrency, formatLongDate, formatTime } from "./format";

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

const MOVEMENT_TYPE_LABEL: Record<CashMovementType, string> = {
  income: "Ingreso",
  expense: "Gasto",
};

const DARK: [number, number, number] = [38, 38, 38];
const MUTED: [number, number, number] = [115, 115, 115];
const LIGHT_ROW: [number, number, number] = [246, 246, 246];

function hexToRgbTuple(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgbTriplet(hex).split(" ").map(Number);
  return [r, g, b];
}

function drawBarChart(
  doc: import("jspdf").jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  bars: { label: string; value: number; color: [number, number, number] }[],
) {
  const maxValue = Math.max(...bars.map((b) => Math.abs(b.value)), 1);
  const gap = 12;
  const barWidth = (width - gap * (bars.length - 1)) / bars.length;

  bars.forEach((bar, i) => {
    const barX = x + i * (barWidth + gap);
    const barHeight = Math.max((Math.abs(bar.value) / maxValue) * height, 2);
    const barY = y + height - barHeight;

    doc.setFillColor(...bar.color);
    doc.roundedRect(barX, barY, barWidth, barHeight, 2, 2, "F");

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text(formatCurrency(bar.value), barX + barWidth / 2, barY - 4, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(bar.label, barX + barWidth / 2, y + height + 7, { align: "center" });
  });
}

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
  doc.text(`Corte de caja — ${formatLongDate(new Date(input.date))}`, marginX, y);

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

  if (input.movements.length === 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text("Sin movimientos manuales este día.", marginX, y);
    y += 7;
  } else {
    // Encabezado de la "tabla" (sin librería de tablas — son pocas filas,
    // alcanza con texto + una franja de color de fondo por fila).
    doc.setFillColor(...DARK);
    doc.rect(marginX, y - 5, rightEdge - marginX, 7, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Hora", marginX + 2, y);
    doc.text("Detalle", marginX + 26, y);
    doc.text("Monto", rightEdge - 2, y, { align: "right" });
    y += 8;

    doc.setFontSize(10);
    input.movements.forEach((movement, i) => {
      if (i % 2 === 1) {
        doc.setFillColor(...LIGHT_ROW);
        doc.rect(marginX, y - 5, rightEdge - marginX, 7, "F");
      }
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...DARK);
      doc.text(formatTime(movement.createdAt), marginX + 2, y);
      doc.text(
        `${MOVEMENT_TYPE_LABEL[movement.type]}${movement.description ? ` — ${movement.description}` : ""}`,
        marginX + 26,
        y,
      );
      doc.setTextColor(...(movement.type === "expense" ? secondary : primary));
      doc.setFont("helvetica", "bold");
      doc.text(
        `${movement.type === "expense" ? "−" : "+"}${formatCurrency(movement.amount)}`,
        rightEdge - 2,
        y,
        { align: "right" },
      );
      y += 7;
    });
  }

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
