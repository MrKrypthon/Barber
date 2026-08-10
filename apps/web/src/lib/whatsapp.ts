// Integración WhatsApp — primera etapa (docs/PROJECT.md §WhatsApp):
// solo links wa.me con mensaje predefinido. Sin API de WhatsApp Business.

export function buildWhatsAppUrl(message: string, phone?: string | null): string {
  const digits = phone?.replace(/\D/g, "");
  const base = digits ? `https://wa.me/${digits}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
}

export type ReceiptData = {
  businessName: string;
  customerName: string;
  serviceName: string;
  paymentMethodLabel: string;
  totalLabel: string;
};

// Refleja el mockup "Comprobante de pago" de docs/Propuesta.pdf.
export function buildReceiptMessage(data: ReceiptData): string {
  return [
    `Pago recibido — ${data.businessName}`,
    "",
    `Cliente: ${data.customerName}`,
    `Servicio: ${data.serviceName}`,
    `Método: ${data.paymentMethodLabel}`,
    `Total: ${data.totalLabel}`,
    "",
    `¡Gracias por venir, ${data.customerName.split(" ")[0]}! Te esperamos la próxima.`,
  ].join("\n");
}
