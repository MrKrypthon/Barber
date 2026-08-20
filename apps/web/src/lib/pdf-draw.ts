import type { CashMovementType } from "@barber/types";
import { hexToRgbTriplet } from "./color";
import { formatCurrency, formatTime, movementLabel } from "./format";

// Helpers de dibujo compartidos entre los distintos PDF de Caja (corte del
// día y reporte por rango) — jsPDF no tiene un plugin de tablas instalado
// (CLAUDE.md §25, sin dependencias sin justificar), así que ambas cosas se
// arman con primitivas (rect/text) reutilizadas acá para no duplicarlas.

export type PdfMovement = {
  type: CashMovementType;
  amount: number;
  description: string | null;
  createdAt: string;
  source: "manual" | "sale";
  customerName: string | null;
  serviceNames: string[];
};

export const DARK: [number, number, number] = [38, 38, 38];
export const MUTED: [number, number, number] = [115, 115, 115];
export const LIGHT_ROW: [number, number, number] = [246, 246, 246];

export function hexToRgbTuple(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgbTriplet(hex).split(" ").map(Number);
  return [r, g, b];
}

// resizeImageToDataUrl (apps/web/src/lib/image.ts) siempre guarda JPEG,
// pero se lee el mime real del data URI por si algún logo viejo quedó en
// otro formato — jsPDF necesita el formato explícito, a diferencia del
// <img> del resto de la app.
function imageFormatFromDataUri(dataUri: string): string {
  const mime = /^data:image\/(\w+);base64,/.exec(dataUri)?.[1]?.toUpperCase();
  return mime === "JPG" ? "JPEG" : (mime ?? "JPEG");
}

// Logo del negocio en la esquina superior derecha (settings.logo, mismo
// data URI cuadrado que ya usa Avatar). Si no hay logo, o si el data URI
// está corrupto, se omite en silencio — un logo roto no debe impedir
// descargar el PDF.
export function drawLogo(
  doc: import("jspdf").jsPDF,
  logo: string | null | undefined,
  rightEdge: number,
): void {
  if (!logo) return;
  const size = 22;
  try {
    doc.addImage(logo, imageFormatFromDataUri(logo), rightEdge - size, 11, size, size);
  } catch {
    // omitido a propósito, ver comentario de arriba.
  }
}

export function drawBarChart(
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

// Tabla de movimientos manuales (encabezado + filas alternadas). Devuelve
// el nuevo `y` para que el que llama pueda seguir dibujando después. No
// decide saltos de página: eso depende de si hay una sola tabla corta (el
// corte del día) o muchas repetidas (el reporte por rango), así que queda
// a cargo de cada generador.
export function drawMovementsTable(
  doc: import("jspdf").jsPDF,
  x: number,
  y: number,
  width: number,
  movements: PdfMovement[],
  primary: [number, number, number],
  secondary: [number, number, number],
  emptyLabel: string,
): number {
  const rightEdge = x + width;

  if (movements.length === 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(emptyLabel, x, y);
    return y + 7;
  }

  doc.setFillColor(...DARK);
  doc.rect(x, y - 5, width, 7, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Hora", x + 2, y);
  doc.text("Detalle", x + 26, y);
  doc.text("Monto", rightEdge - 2, y, { align: "right" });
  y += 8;

  doc.setFontSize(10);
  movements.forEach((movement, i) => {
    if (i % 2 === 1) {
      doc.setFillColor(...LIGHT_ROW);
      doc.rect(x, y - 5, width, 7, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    doc.text(formatTime(movement.createdAt), x + 2, y);
    doc.text(movementLabel(movement), x + 26, y);
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

  return y;
}

// Altura que va a ocupar drawMovementsTable, para decidir un salto de
// página ANTES de dibujar (jsPDF no reflowea solo).
export function movementsTableHeight(movements: PdfMovement[]): number {
  return movements.length === 0 ? 7 : 8 + movements.length * 7;
}
