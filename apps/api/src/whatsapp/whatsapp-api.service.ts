import { Injectable } from "@nestjs/common";
import { WhatsAppApiError } from "./whatsapp-api.error";

// Versión de la Graph API de Meta — no hace falta que sea configurable por
// env, Meta mantiene cada versión estable por ~2 años; alcanza con
// actualizar este literal cuando corresponda.
const GRAPH_API_VERSION = "v21.0";

type SendTemplateMessageParams = {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  templateName: string;
  languageCode: string;
  // Parámetros posicionales del cuerpo de la plantilla ({{1}}, {{2}}, ...).
  parameters: string[];
};

type SendImageMessageParams = {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  imageBuffer: Buffer;
  caption?: string;
};

// Cliente delgado sobre la Graph API de Meta (WhatsApp Business Platform,
// ADR-011 en docs/DECISIONS.md) — sin SDK de terceros, un par de llamadas a
// fetch (global en Node 18+) alcanzan y evitan otra dependencia.
@Injectable()
export class WhatsAppApiService {
  async sendTemplateMessage(params: SendTemplateMessageParams): Promise<void> {
    await this.callMessagesEndpoint(params.phoneNumberId, params.accessToken, {
      messaging_product: "whatsapp",
      to: params.to,
      type: "template",
      template: {
        name: params.templateName,
        language: { code: params.languageCode },
        components: [
          {
            type: "body",
            parameters: params.parameters.map((text) => ({ type: "text", text })),
          },
        ],
      },
    });
  }

  async sendImageMessage(params: SendImageMessageParams): Promise<void> {
    const mediaId = await this.uploadMedia(params.phoneNumberId, params.accessToken, params.imageBuffer);
    await this.callMessagesEndpoint(params.phoneNumberId, params.accessToken, {
      messaging_product: "whatsapp",
      to: params.to,
      type: "image",
      image: { id: mediaId, caption: params.caption },
    });
  }

  private async uploadMedia(
    phoneNumberId: string,
    accessToken: string,
    imageBuffer: Buffer,
  ): Promise<string> {
    const form = new FormData();
    form.append("messaging_product", "whatsapp");
    form.append("file", new Blob([imageBuffer], { type: "image/png" }), "recibo.png");

    const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/media`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });
    if (!res.ok) {
      throw new WhatsAppApiError(res.status, await res.text());
    }
    const data = (await res.json()) as { id: string };
    return data.id;
  }

  private async callMessagesEndpoint(
    phoneNumberId: string,
    accessToken: string,
    body: Record<string, unknown>,
  ): Promise<void> {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new WhatsAppApiError(res.status, await res.text());
    }
  }
}
