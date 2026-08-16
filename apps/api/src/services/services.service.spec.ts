import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ServicesService } from "./services.service";

describe("ServicesService", () => {
  let service: ServicesService;
  let prisma: {
    service: {
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      findFirst: jest.Mock;
    };
  };

  const baseService = {
    id: "svc-1",
    tenantId: "tenant-1",
    name: "Corte clásico",
    price: 150,
    active: true,
    commissionPercent: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(() => {
    prisma = {
      service: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
    };
    service = new ServicesService(prisma as unknown as PrismaService);
  });

  describe("findAll", () => {
    it("escopa la consulta al tenant y excluye eliminados", async () => {
      prisma.service.findMany.mockResolvedValue([baseService]);

      const result = await service.findAll("tenant-1");

      expect(prisma.service.findMany).toHaveBeenCalledWith({
        where: { tenantId: "tenant-1", deletedAt: null },
        orderBy: { name: "asc" },
      });
      expect(result).toEqual([expect.objectContaining({ id: "svc-1", price: 150 })]);
    });
  });

  describe("create", () => {
    it("crea el servicio asociado al tenant, activo por defecto", async () => {
      prisma.service.create.mockResolvedValue(baseService);

      await service.create("tenant-1", { name: "Corte clásico", price: 150 });

      expect(prisma.service.create).toHaveBeenCalledWith({
        data: { tenantId: "tenant-1", name: "Corte clásico", price: 150, active: true },
      });
    });

    it("convierte commissionPercent de Decimal a number; null si no se configuró", async () => {
      prisma.service.create.mockResolvedValue({ ...baseService, commissionPercent: "40.50" as never });

      const result = await service.create("tenant-1", {
        name: "Corte clásico",
        price: 150,
        commissionPercent: 40.5,
      });

      expect(prisma.service.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ commissionPercent: 40.5 }),
      });
      expect(result.commissionPercent).toBe(40.5);

      prisma.service.create.mockResolvedValue(baseService);
      const withoutCommission = await service.create("tenant-1", { name: "Barba", price: 50 });
      expect(withoutCommission.commissionPercent).toBeNull();
    });
  });

  describe("aislamiento de tenant", () => {
    it("update lanza NotFoundException si el servicio pertenece a otro tenant", async () => {
      prisma.service.findFirst.mockResolvedValue(null);

      await expect(
        service.update("tenant-1", "svc-de-otro-tenant", { price: 1 }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.service.update).not.toHaveBeenCalled();
    });

    it("remove lanza NotFoundException si el servicio pertenece a otro tenant", async () => {
      prisma.service.findFirst.mockResolvedValue(null);

      await expect(service.remove("tenant-1", "svc-de-otro-tenant")).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(prisma.service.update).not.toHaveBeenCalled();
    });

    it("update funciona cuando el servicio sí pertenece al tenant", async () => {
      prisma.service.findFirst.mockResolvedValue(baseService);
      prisma.service.update.mockResolvedValue({ ...baseService, price: 200 });

      const result = await service.update("tenant-1", "svc-1", { price: 200 });

      expect(prisma.service.findFirst).toHaveBeenCalledWith({
        where: { id: "svc-1", tenantId: "tenant-1", deletedAt: null },
      });
      expect(result.price).toBe(200);
    });
  });
});
