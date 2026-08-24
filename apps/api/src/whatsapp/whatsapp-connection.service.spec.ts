import { PrismaService } from "../prisma/prisma.service";
import { WhatsAppConnectionService } from "./whatsapp-connection.service";

describe("WhatsAppConnectionService", () => {
  let service: WhatsAppConnectionService;
  let prisma: {
    whatsAppConnection: { findUnique: jest.Mock; upsert: jest.Mock; deleteMany: jest.Mock };
  };

  const connection = {
    tenantId: "tenant-1",
    phoneNumberId: "123456",
    wabaId: "789012",
    accessToken: "EAABsomeVeryLongToken1234",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = {
      whatsAppConnection: { findUnique: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn() },
    };
    service = new WhatsAppConnectionService(prisma as unknown as PrismaService);
  });

  describe("get", () => {
    it("connected=false y todo null si el tenant nunca conectó WhatsApp", async () => {
      prisma.whatsAppConnection.findUnique.mockResolvedValue(null);

      const result = await service.get("tenant-1");

      expect(result).toEqual({
        connected: false,
        phoneNumberId: null,
        wabaId: null,
        accessTokenPreview: null,
      });
    });

    it("nunca devuelve el access token completo, solo los últimos 4 caracteres", async () => {
      prisma.whatsAppConnection.findUnique.mockResolvedValue(connection);

      const result = await service.get("tenant-1");

      expect(result.connected).toBe(true);
      expect(result.accessTokenPreview).toBe("••••1234");
      expect(JSON.stringify(result)).not.toContain(connection.accessToken);
    });
  });

  describe("upsert", () => {
    it("crea o actualiza la conexión del tenant", async () => {
      prisma.whatsAppConnection.upsert.mockResolvedValue(connection);

      await service.upsert("tenant-1", {
        phoneNumberId: "123456",
        wabaId: "789012",
        accessToken: "EAABsomeVeryLongToken1234",
      });

      expect(prisma.whatsAppConnection.upsert).toHaveBeenCalledWith({
        where: { tenantId: "tenant-1" },
        update: {
          phoneNumberId: "123456",
          wabaId: "789012",
          accessToken: "EAABsomeVeryLongToken1234",
        },
        create: {
          tenantId: "tenant-1",
          phoneNumberId: "123456",
          wabaId: "789012",
          accessToken: "EAABsomeVeryLongToken1234",
        },
      });
    });
  });

  describe("getCredentials", () => {
    it("devuelve null si el tenant no tiene conexión", async () => {
      prisma.whatsAppConnection.findUnique.mockResolvedValue(null);

      expect(await service.getCredentials("tenant-1")).toBeNull();
    });

    it("devuelve el token completo para uso interno (cron, envío de recibos)", async () => {
      prisma.whatsAppConnection.findUnique.mockResolvedValue(connection);

      const result = await service.getCredentials("tenant-1");

      expect(result).toEqual({ phoneNumberId: "123456", accessToken: "EAABsomeVeryLongToken1234" });
    });
  });
});
