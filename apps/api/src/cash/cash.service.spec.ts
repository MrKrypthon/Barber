import { PrismaService } from "../prisma/prisma.service";
import { CashService } from "./cash.service";

describe("CashService", () => {
  let service: CashService;
  let prisma: {
    sale: { aggregate: jest.Mock };
    cashMovement: { findMany: jest.Mock; create: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      sale: { aggregate: jest.fn() },
      cashMovement: { findMany: jest.fn(), create: jest.fn() },
    };
    service = new CashService(prisma as unknown as PrismaService);
  });

  describe("getSummary", () => {
    it("combina ventas en efectivo + ingresos manuales, resta egresos", async () => {
      prisma.sale.aggregate.mockResolvedValue({ _sum: { total: 300 } });
      prisma.cashMovement.findMany.mockResolvedValue([
        { id: "m1", type: "income", amount: 50, description: "Aporte", createdAt: new Date() },
        { id: "m2", type: "expense", amount: 20, description: "Insumos", createdAt: new Date() },
      ]);

      const result = await service.getSummary("tenant-1", "today");

      expect(result.income).toBe(350);
      expect(result.expense).toBe(20);
      expect(result.balance).toBe(330);
      expect(result.movements).toHaveLength(2);
    });

    it("solo cuenta ventas pagadas en efectivo, no por transferencia", async () => {
      prisma.sale.aggregate.mockResolvedValue({ _sum: { total: 100 } });
      prisma.cashMovement.findMany.mockResolvedValue([]);

      await service.getSummary("tenant-1", "today");

      expect(prisma.sale.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ paymentMethod: "cash" }),
        }),
      );
    });

    it("si no hay ventas ni movimientos, todo queda en cero", async () => {
      prisma.sale.aggregate.mockResolvedValue({ _sum: { total: null } });
      prisma.cashMovement.findMany.mockResolvedValue([]);

      const result = await service.getSummary("tenant-1", "today");

      expect(result).toMatchObject({ income: 0, expense: 0, balance: 0 });
    });
  });

  describe("registerMovement", () => {
    it("crea el movimiento asociado al tenant", async () => {
      prisma.cashMovement.create.mockResolvedValue({
        id: "m1",
        type: "expense",
        amount: 20,
        description: "Insumos",
        createdAt: new Date(),
      });

      await service.registerMovement("tenant-1", {
        type: "expense",
        amount: 20,
        description: "Insumos",
      } as never);

      expect(prisma.cashMovement.create).toHaveBeenCalledWith({
        data: { tenantId: "tenant-1", type: "expense", amount: 20, description: "Insumos" },
      });
    });
  });
});
