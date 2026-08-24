import { createHmac, timingSafeEqual } from "crypto";

// Meta firma cada POST al webhook con HMAC-SHA256 del body crudo, usando el
// App Secret de la app de Meta (WHATSAPP_APP_SECRET) — nunca hay que
// procesar un webhook sin esto: cualquiera que sepa la URL podría, si no,
// mandar eventos falsos (turnos/recordatorios inventados).
export function verifyWhatsAppSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  appSecret: string,
): boolean {
  if (!signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const provided = signatureHeader.slice("sha256=".length);

  const expectedBuffer = Buffer.from(expected, "hex");
  const providedBuffer = Buffer.from(provided, "hex");
  // timingSafeEqual exige buffers del mismo largo — si difieren, la firma ya
  // es inválida (evita filtrar por timing si además fuera de largo distinto).
  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}
