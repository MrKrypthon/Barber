import { createHmac } from "crypto";
import { verifyWhatsAppSignature } from "./webhook-signature.util";

describe("verifyWhatsAppSignature", () => {
  const appSecret = "test-app-secret";
  const rawBody = Buffer.from(JSON.stringify({ entry: [{ id: "1" }] }));

  function sign(body: Buffer, secret: string): string {
    return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  }

  it("acepta una firma válida", () => {
    const signature = sign(rawBody, appSecret);
    expect(verifyWhatsAppSignature(rawBody, signature, appSecret)).toBe(true);
  });

  it("rechaza una firma calculada con el secreto equivocado", () => {
    const signature = sign(rawBody, "otro-secreto");
    expect(verifyWhatsAppSignature(rawBody, signature, appSecret)).toBe(false);
  });

  it("rechaza si el body fue modificado después de firmarlo", () => {
    const signature = sign(rawBody, appSecret);
    const tamperedBody = Buffer.from(JSON.stringify({ entry: [{ id: "2" }] }));
    expect(verifyWhatsAppSignature(tamperedBody, signature, appSecret)).toBe(false);
  });

  it("rechaza si falta el header de firma", () => {
    expect(verifyWhatsAppSignature(rawBody, undefined, appSecret)).toBe(false);
  });

  it("rechaza un header sin el prefijo sha256=", () => {
    const raw = createHmac("sha256", appSecret).update(rawBody).digest("hex");
    expect(verifyWhatsAppSignature(rawBody, raw, appSecret)).toBe(false);
  });

  it("rechaza una firma de largo distinto sin tirar una excepción", () => {
    expect(verifyWhatsAppSignature(rawBody, "sha256=abc123", appSecret)).toBe(false);
  });
});
