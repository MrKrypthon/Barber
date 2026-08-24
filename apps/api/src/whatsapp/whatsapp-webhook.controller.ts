import { Controller, Get, HttpCode, Logger, Post, Query, Req, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";
import { verifyWhatsAppSignature } from "./webhook-signature.util";

type RequestWithRawBody = Request & { rawBody?: Buffer };

// Sin JwtAuthGuard a propósito: a este endpoint lo llama Meta, no un usuario
// logueado — la autenticidad se verifica con la firma HMAC (ver
// verifyWhatsAppSignature), no con un token de sesión.
//
// El procesamiento de mensajes entrantes (reserva automática desde WhatsApp)
// queda para una segunda etapa — por ahora este webhook solo confirma el
// alta ante Meta y deja los eventos entrantes registrados en el log, ya que
// esta ronda se acotó a recordatorios + recibos salientes.
@Controller("whatsapp/webhook")
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(private readonly config: ConfigService) {}

  // Meta llama esto una única vez al registrar la URL del webhook, para
  // confirmar que es tuya. Tiene que devolver hub.challenge tal cual si el
  // verify_token coincide con el que vos elegiste al darlo de alta.
  @Get()
  verify(
    @Query("hub.mode") mode: string,
    @Query("hub.verify_token") token: string,
    @Query("hub.challenge") challenge: string,
    @Res() res: Response,
  ): void {
    const expectedToken = this.config.get<string>("WHATSAPP_VERIFY_TOKEN");
    if (mode === "subscribe" && expectedToken && token === expectedToken) {
      res.status(200).send(challenge);
      return;
    }
    res.status(403).send();
  }

  @Post()
  @HttpCode(200)
  receive(@Req() req: RequestWithRawBody, @Res() res: Response): void {
    const appSecret = this.config.get<string>("WHATSAPP_APP_SECRET");
    const signature = req.headers["x-hub-signature-256"];

    if (
      !appSecret ||
      !req.rawBody ||
      typeof signature !== "string" ||
      !verifyWhatsAppSignature(req.rawBody, signature, appSecret)
    ) {
      this.logger.warn("Webhook de WhatsApp con firma inválida — ignorado.");
      res.status(200).send(); // 200 igual: Meta reintenta agresivamente ante cualquier no-200.
      return;
    }

    // TODO (segunda etapa): interpretar mensajes entrantes para reservar
    // turnos automáticamente. Por ahora solo se registra el evento.
    this.logger.log(`Evento de WhatsApp recibido: ${JSON.stringify(req.body)}`);
    res.status(200).send();
  }
}
