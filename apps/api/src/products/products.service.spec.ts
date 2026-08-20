import { BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ProductsService } from "./products.service";

describe("ProductsService", () => {
  let service: ProductsService;
  let prisma: {
    product: {
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      findFirst: jest.Mock;
    };
    productMovement: {
      findMany: jest.Mock;
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const baseProduct = {
    id: "prod-1",
    tenantId: "tenant-1",
    name: "Pomada mate",
    stock: 10,
    minStock: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(() => {
    prisma = {
      product: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
      productMovement: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn((ops: unknown[]) => Promise.resolve(ops)),
    };
    service = new ProductsService(prisma as unknown as PrismaService);
  });

  describe("findAll", () => {
    it("escopa la consulta al tenant y excluye eliminados", async () => {
      prisma.product.findMany.mockResolvedValue([baseProduct]);

      const result = await service.findAll("tenant-1");

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { tenantId: "tenant-1", deletedAt: null },
        orderBy: { name: "asc" },
      });
      expect(result).toEqual([expect.objectContaining({ id: "prod-1", stock: 10 })]);
    });
  });

  describe("create", () => {
    it("arranca en stock 0 si no se especifica", async () => {
      prisma.product.create.mockResolvedValue({ ...baseProduct, stock: 0, minStock: null });

      await service.create("tenant-1", { name: "Cera" });

      expect(prisma.product.create).toHaveBeenCalledWith({
        data: { tenantId: "tenant-1", name: "Cera", stock: 0, minStock: undefined },
      });
    });
  });

  describe("update", () => {
    it("nunca escribe stock aunque el DTO lo incluya", async () => {
      prisma.product.findFirst.mockResolvedValue(baseProduct);
      prisma.product.update.mockResolvedValue({ ...baseProduct, name: "Pomada mate XL" });

      await service.update("tenant-1", "prod-1", {
        name: "Pomada mate XL",
        stock: 999,
      } as never);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { name: "Pomada mate XL", minStock: undefined },
      });
    });
  });

  describe("aislamiento de tenant", () => {
    it("update lanza NotFoundException si el producto pertenece a otro tenant", async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(
        service.update("tenant-1", "prod-de-otro-tenant", { name: "x" }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it("remove lanza NotFoundException si el producto pertenece a otro tenant", async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(service.remove("tenant-1", "prod-de-otro-tenant")).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(prisma.product.update).not.toHaveBeenCalled();
    });
  });

  describe("registerMovement", () => {
    it("suma stock en una entrada", async () => {
      prisma.product.findFirst.mockResolvedValue(baseProduct);
      prisma.product.update.mockReturnValue({ ...baseProduct, stock: 15 });
      const createdMovement = {
        id: "mov-1",
        type: "entry",
        quantity: 5,
        description: "Reposición",
        createdAt: new Date(),
      };
      prisma.productMovement.create.mockReturnValue(createdMovement);

      const result = await service.registerMovement("tenant-1", "prod-1", {
        type: "entry" as never,
        quantity: 5,
        description: "Reposición",
      });

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { stock: { increment: 5 } },
      });
      expect(result).toEqual(expect.objectContaining({ id: "mov-1", quantity: 5 }));
    });

    it("resta stock en una salida", async () => {
      prisma.product.findFirst.mockResolvedValue(baseProduct);
      prisma.product.update.mockReturnValue({ ...baseProduct, stock: 8 });
      prisma.productMovement.create.mockReturnValue({
        id: "mov-2",
        type: "exit",
        quantity: 2,
        description: null,
        createdAt: new Date(),
      });

      await service.registerMovement("tenant-1", "prod-1", {
        type: "exit" as never,
        quantity: 2,
      });

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { stock: { increment: -2 } },
      });
    });

    it("rechaza una salida que dejaría el stock en negativo", async () => {
      prisma.product.findFirst.mockResolvedValue(baseProduct);

      await expect(
        service.registerMovement("tenant-1", "prod-1", {
          type: "exit" as never,
          quantity: 999,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("lanza NotFoundException si el producto pertenece a otro tenant", async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(
        service.registerMovement("tenant-1", "prod-de-otro-tenant", {
          type: "entry" as never,
          quantity: 1,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("findMovements", () => {
    it("escopa por tenant y producto, ordenado del más reciente al más viejo", async () => {
      prisma.product.findFirst.mockResolvedValue(baseProduct);
      prisma.productMovement.findMany.mockResolvedValue([]);

      await service.findMovements("tenant-1", "prod-1");

      expect(prisma.productMovement.findMany).toHaveBeenCalledWith({
        where: { tenantId: "tenant-1", productId: "prod-1" },
        orderBy: { createdAt: "desc" },
      });
    });
  });
});
