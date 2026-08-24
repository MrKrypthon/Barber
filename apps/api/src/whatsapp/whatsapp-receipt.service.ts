import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { formatDateLabel } from "./date-labels.util";
import { ReceiptImageService } from "./receipt-image.service";
import { WhatsAppApiService } from "./whatsapp-api.service";
import { WhatsAppConnectionService } from "./whatsapp-connection.service";

export type ReceiptSaleData = {
  customerPhone: string | null;
  customerName: string;
  serviceNames: string[];
  total: number;
  paymentMethodLabel: string;
};

function formatCurrencyLabel(amount: number): string {
  return `$${Math.round(amount).toLocaleString("es-AR")}`;
}

// Envía el comprobante de una venta como imagen por WhatsApp (docs/PROJECT.md,
// integración WhatsApp) — llamado por SalesService.create como
// "fire-and-forget": un fallo acá nunca debe impedir que la venta se
// registre, así que el llamador solo loguea el error, no lo propaga.
@Injectable()
export class WhatsAppReceiptService {
  private readonly logger = new Logger(WhatsAppReceiptService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly connectionService: WhatsAppConnectionService,
    private readonly whatsAppApi: WhatsAppApiService,
    private readonly receiptImage: ReceiptImageService,
  ) {}

  async sendReceiptIfPossible(tenantId: string, sale: ReceiptSaleData): Promise<void> {
    if (!sale.customerPhone) {
      return;
    }

    const credentials = await this.connectionService.getCredentials(tenantId);
    if (!credentials) {
      return;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { businessSettings: true },
    });
    if (!tenant) {
      return;
    }

    const imageBuffer = await this.receiptImage.build({
      businessName: tenant.name,
      customerName: sale.customerName,
      serviceName: sale.serviceNames.join(", "),
      paymentMethodLabel: sale.paymentMethodLabel,
      totalLabel: formatCurrencyLabel(sale.total),
      dateLabel: formatDateLabel(new Date()),
      primaryColor: tenant.businessSettings?.primaryColor,
      backgroundColor: tenant.businessSettings?.backgroundColor,
    });

    await this.whatsAppApi.sendImageMessage({
      phoneNumberId: credentials.phoneNumberId,
      accessToken: credentials.accessToken,
      to: sale.customerPhone.replace(/\D/g, ""),
      imageBuffer,
      caption: `¡Gracias por venir a ${tenant.name}!`,
    });
  }

  // Wrapper "fire-and-forget" para SalesService: nunca rechaza, solo loguea
  // — ver comentario de arriba sobre por qué un fallo acá no debe tumbar
  // el registro de la venta.
  sendReceiptSafely(tenantId: string, sale: ReceiptSaleData): void {
    this.sendReceiptIfPossible(tenantId, sale).catch((err) => {
      this.logger.error(`No se pudo enviar el recibo por WhatsApp (tenant ${tenantId})`, err);
    });
  }
}
