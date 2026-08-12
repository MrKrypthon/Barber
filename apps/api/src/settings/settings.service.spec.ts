import { PrismaService } from "../prisma/prisma.service";
import { SettingsService } from "./settings.service";

describe("SettingsService", () => {
  let service: SettingsService;
  let prisma: {
    tenant: { findUniqueOrThrow: jest.Mock; update: jest.Mock };
    businessSettings: { findUnique: jest.Mock; upsert: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      tenant: { findUniqueOrThrow: jest.fn(), update: jest.fn() },
      businessSettings: { findUnique: jest.fn(), upsert: jest.fn() },
    };
    service = new SettingsService(prisma as unknown as PrismaService);
  });

  describe("get", () => {
    it("combina el nombre del tenant con business_settings", async () => {
      prisma.tenant.findUniqueOrThrow.mockResolvedValue({ id: "t1", name: "Barbería Demo" });
      prisma.businessSettings.findUnique.mockResolvedValue({
        primaryColor: "#24406B",
        secondaryColor: "#C0392B",
        logo: null,
        phone: null,
        address: null,
        scheduleDays: ["mon", "tue"],
        scheduleOpen: "09:00",
        scheduleClose: "19:00",
      });

      const result = await service.get("t1");

      expect(result).toEqual({
        businessName: "Barbería Demo",
        primaryColor: "#24406B",
        secondaryColor: "#C0392B",
        logo: null,
        phone: null,
        address: null,
        scheduleDays: ["mon", "tue"],
        scheduleOpen: "09:00",
        scheduleClose: "19:00",
      });
    });

    it("si nunca se configuró nada, devuelve solo el nombre del tenant y nulls", async () => {
      prisma.tenant.findUniqueOrThrow.mockResolvedValue({ id: "t1", name: "Barbería Demo" });
      prisma.businessSettings.findUnique.mockResolvedValue(null);

      const result = await service.get("t1");

      expect(result).toEqual({
        businessName: "Barbería Demo",
        primaryColor: null,
        secondaryColor: null,
        logo: null,
        phone: null,
        address: null,
        scheduleDays: [],
        scheduleOpen: null,
        scheduleClose: null,
      });
    });
  });

  describe("update", () => {
    it("hace upsert de business_settings sin tocar el tenant si no viene businessName", async () => {
      prisma.tenant.findUniqueOrThrow.mockResolvedValue({ id: "t1", name: "Barbería Demo" });
      prisma.businessSettings.upsert.mockResolvedValue({
        primaryColor: "#111111",
        secondaryColor: null,
        logo: null,
        phone: null,
        address: null,
      });

      await service.update("t1", { primaryColor: "#111111" } as never);

      expect(prisma.tenant.update).not.toHaveBeenCalled();
      expect(prisma.businessSettings.upsert).toHaveBeenCalledWith({
        where: { tenantId: "t1" },
        create: { tenantId: "t1", primaryColor: "#111111" },
        update: { primaryColor: "#111111" },
      });
    });

    it("actualiza el nombre del tenant cuando viene businessName", async () => {
      prisma.tenant.update.mockResolvedValue({ id: "t1", name: "Nuevo Nombre" });
      prisma.businessSettings.upsert.mockResolvedValue({
        primaryColor: null,
        secondaryColor: null,
        logo: null,
        phone: null,
        address: null,
      });

      const result = await service.update("t1", { businessName: "Nuevo Nombre" } as never);

      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: "t1" },
        data: { name: "Nuevo Nombre" },
      });
      expect(result.businessName).toBe("Nuevo Nombre");
    });
  });
});
