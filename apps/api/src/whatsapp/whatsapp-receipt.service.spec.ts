import { PrismaService } from "../prisma/prisma.service";
import { ReceiptImageService } from "./receipt-image.service";
import { WhatsAppApiService } from "./whatsapp-api.service";
import { WhatsAppConnectionService } from "./whatsapp-connection.service";
import { WhatsAppReceiptService } from "./whatsapp-receipt.service";

describe("WhatsAppReceiptService", () => {
  let service: WhatsAppReceiptService;
  let prisma: { tenant: { findUnique: jest.Mock } };
  let connectionService: { getCredentials: jest.Mock };
  let whatsAppApi: { sendImageMessage: jest.Mock };
  let receiptImage: { build: jest.Mock };

  const saleData = {
    customerPhone: "+52 55 1234 5678",
    customerName: "Juan Pérez",
    serviceNames: ["Corte", "Barba"],
    total: 150,
    paymentMethodLabel: "Efectivo",
  };

  beforeEach(() => {
    prisma = { tenant: { findUnique: jest.fn() } };
    connectionService = { getCredentials: jest.fn() };
    whatsAppApi = { sendImageMessage: jest.fn().mockResolvedValue(undefined) };
    receiptImage = { build: jest.fn().mockResolvedValue(Buffer.from("fake-png")) };

    service = new WhatsAppReceiptService(
      prisma as unknown as PrismaService,
      connectionService as unknown as WhatsAppConnectionService,
      whatsAppApi as unknown as WhatsAppApiService,
      receiptImage as unknown as ReceiptImageService,
    );
  });

  describe("sendReceiptIfPossible", () => {
    it("no hace nada si la venta no tiene cliente con teléfono", async () => {
      await service.sendReceiptIfPossible("tenant-1", { ...saleData, customerPhone: null });

      expect(connectionService.getCredentials).not.toHaveBeenCalled();
    });

    it("no hace nada si el tenant no conectó WhatsApp", async () => {
      connectionService.getCredentials.mockResolvedValue(null);

      await service.sendReceiptIfPossible("tenant-1", saleData);

      expect(receiptImage.build).not.toHaveBeenCalled();
      expect(whatsAppApi.sendImageMessage).not.toHaveBeenCalled();
    });

    it("genera la imagen y la manda al teléfono del cliente (solo dígitos)", async () => {
      connectionService.getCredentials.mockResolvedValue({
        phoneNumberId: "123456",
        accessToken: "token-abc",
      });
      prisma.tenant.findUnique.mockResolvedValue({
        id: "tenant-1",
        name: "Mi Barbería",
        businessSettings: { primaryColor: "#111111", backgroundColor: "#eeeeee" },
      });

      await service.sendReceiptIfPossible("tenant-1", saleData);

      expect(receiptImage.build).toHaveBeenCalledWith(
        expect.objectContaining({
          businessName: "Mi Barbería",
          customerName: "Juan Pérez",
          serviceName: "Corte, Barba",
          paymentMethodLabel: "Efectivo",
          totalLabel: "$150",
        }),
      );
      expect(whatsAppApi.sendImageMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          phoneNumberId: "123456",
          accessToken: "token-abc",
          to: "525512345678",
          imageBuffer: Buffer.from("fake-png"),
        }),
      );
    });
  });

  describe("sendReceiptSafely", () => {
    it("nunca rechaza aunque falle el envío por dentro", () => {
      connectionService.getCredentials.mockRejectedValue(new Error("boom"));

      expect(() => service.sendReceiptSafely("tenant-1", saleData)).not.toThrow();
    });
  });
});
