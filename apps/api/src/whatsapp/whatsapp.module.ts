import { Module } from "@nestjs/common";
import { ReceiptImageService } from "./receipt-image.service";
import { RemindersCron } from "./reminders.cron";
import { WhatsAppApiService } from "./whatsapp-api.service";
import { WhatsAppConnectionController } from "./whatsapp-connection.controller";
import { WhatsAppConnectionService } from "./whatsapp-connection.service";
import { WhatsAppReceiptService } from "./whatsapp-receipt.service";
import { WhatsAppWebhookController } from "./whatsapp-webhook.controller";

@Module({
  controllers: [WhatsAppConnectionController, WhatsAppWebhookController],
  providers: [
    WhatsAppConnectionService,
    WhatsAppApiService,
    ReceiptImageService,
    WhatsAppReceiptService,
    RemindersCron,
  ],
  // WhatsAppReceiptService lo usa SalesService para mandar el recibo al
  // confirmar una venta (fire-and-forget, ver comentario en ese servicio).
  exports: [WhatsAppReceiptService],
})
export class WhatsAppModule {}
