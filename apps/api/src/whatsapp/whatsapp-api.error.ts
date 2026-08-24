// Error de la Graph API de Meta (credenciales inválidas, plantilla no
// aprobada, número no verificado, etc.) — se atrapa donde se usa
// (RemindersCron, WhatsAppReceiptService) para que un fallo de WhatsApp
// nunca tumbe el flujo que lo disparó (agendar un turno, cobrar una venta).
export class WhatsAppApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly responseBody: string,
  ) {
    super(`Error de la API de WhatsApp (${status}): ${responseBody}`);
    this.name = "WhatsAppApiError";
  }
}
