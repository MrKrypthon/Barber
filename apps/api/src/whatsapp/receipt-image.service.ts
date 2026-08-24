import { Injectable } from "@nestjs/common";
import sharp from "sharp";

// Mismos valores por defecto que apps/web/src/lib/brand-defaults.ts — acá
// no se pueden importar directo (backend y frontend son deploys separados),
// así que quedan duplicados a propósito, solo como fallback si el negocio
// nunca configuró colores.
const DEFAULT_PRIMARY_COLOR = "#24406B";
const DEFAULT_BACKGROUND_COLOR = "#F5F1E8";
const DARK = "#262626";
const MUTED = "#737373";

export type ReceiptImageData = {
  businessName: string;
  customerName: string;
  serviceName: string;
  paymentMethodLabel: string;
  totalLabel: string;
  dateLabel: string;
  primaryColor?: string | null;
  backgroundColor?: string | null;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Recibo en foto para WhatsApp (docs/PROJECT.md, integración WhatsApp) — se
// arma como SVG (texto plano, sin dependencias de fuentes/canvas nativo más
// allá de sharp) y se rasteriza a PNG, que es lo que acepta la Graph API de
// Meta para mensajes de imagen.
@Injectable()
export class ReceiptImageService {
  async build(data: ReceiptImageData): Promise<Buffer> {
    const svg = this.buildSvg(data);
    return sharp(Buffer.from(svg)).png().toBuffer();
  }

  private buildSvg(data: ReceiptImageData): string {
    const primary = data.primaryColor ?? DEFAULT_PRIMARY_COLOR;
    const background = data.backgroundColor ?? DEFAULT_BACKGROUND_COLOR;
    const font = "font-family='Helvetica, Arial, sans-serif'";

    return `<svg width="600" height="480" xmlns="http://www.w3.org/2000/svg">
  <rect width="600" height="480" fill="${background}" />
  <rect x="0" y="0" width="600" height="8" fill="${primary}" />
  <text x="40" y="64" ${font} font-size="28" font-weight="bold" fill="${DARK}">${escapeXml(data.businessName)}</text>
  <text x="40" y="92" ${font} font-size="16" fill="${MUTED}">Comprobante de pago</text>
  <line x1="40" y1="112" x2="560" y2="112" stroke="#E5E5E5" stroke-width="2" />
  ${this.row(160, "Cliente", data.customerName)}
  ${this.row(200, "Servicio", data.serviceName)}
  ${this.row(240, "Método", data.paymentMethodLabel)}
  ${this.row(280, "Fecha", data.dateLabel)}
  <line x1="40" y1="310" x2="560" y2="310" stroke="#E5E5E5" stroke-width="2" />
  <text x="40" y="370" ${font} font-size="18" fill="${MUTED}">Total</text>
  <text x="560" y="376" text-anchor="end" ${font} font-size="40" font-weight="bold" fill="${DARK}">${escapeXml(data.totalLabel)}</text>
  <text x="300" y="440" text-anchor="middle" ${font} font-size="15" fill="${MUTED}">¡Gracias por venir! Te esperamos la próxima.</text>
</svg>`;
  }

  private row(y: number, label: string, value: string): string {
    const font = "font-family='Helvetica, Arial, sans-serif'";
    return `<text x="40" y="${y}" ${font} font-size="18" fill="${MUTED}">${escapeXml(label)}</text><text x="560" y="${y}" text-anchor="end" ${font} font-size="18" font-weight="bold" fill="${DARK}">${escapeXml(value)}</text>`;
  }
}
