import { BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CashService } from "./cash.service";

describe("CashService", () => {
  let service: CashService;
  let prisma: {
    sale: { aggregate: jest.Mock; findMany: jest.Mock };
    cashMovement: { findMany: jest.Mock; create: jest.Mock };
    cashClosing: { findUnique: jest.Mock; findMany: jest.Mock; create: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      sale: { aggregate: jest.fn(), findMany: jest.fn() },
      cashMovement: { findMany: jest.fn(), create: jest.fn() },
      cashClosing: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn(),
        create: jest.fn(),
      },
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

    it("closedAt refleja el corte de caja del día cuando range=today", async () => {
      prisma.sale.aggregate.mockResolvedValue({ _sum: { total: null } });
      prisma.cashMovement.findMany.mockResolvedValue([]);
      const closedAt = new Date();
      prisma.cashClosing.findUnique.mockResolvedValue({ id: "c1", createdAt: closedAt });

      const result = await service.getSummary("tenant-1", "today");

      expect(result.closedAt).toBe(closedAt);
    });

    it("closedAt es siempre null fuera de range=today", async () => {
      prisma.sale.aggregate.mockResolvedValue({ _sum: { total: null } });
      prisma.cashMovement.findMany.mockResolvedValue([]);

      const result = await service.getSummary("tenant-1", "week");

      expect(result.closedAt).toBeNull();
      expect(prisma.cashClosing.findUnique).not.toHaveBeenCalled();
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

  describe("close", () => {
    it("crea el snapshot del día con el resumen actual", async () => {
      prisma.sale.aggregate.mockResolvedValue({ _sum: { total: 300 } });
      prisma.cashMovement.findMany.mockResolvedValue([
        { id: "m1", type: "expense", amount: 50, description: "Insumos", createdAt: new Date() },
      ]);
      const closedAt = new Date();
      prisma.cashClosing.create.mockResolvedValue({
        id: "c1",
        income: 300,
        expense: 50,
        balance: 250,
        createdAt: closedAt,
        closedBy: { id: "user-1", name: "Ana" },
      });

      const result = await service.close("tenant-1", "user-1");

      expect(prisma.cashClosing.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: "tenant-1",
            income: 300,
            expense: 50,
            balance: 250,
            closedById: "user-1",
          }),
        }),
      );
      expect(result).toEqual({
        id: "c1",
        income: 300,
        expense: 50,
        balance: 250,
        closedBy: { id: "user-1", name: "Ana" },
        closedAt,
      });
    });

    it("rechaza cerrar la caja dos veces el mismo día", async () => {
      prisma.cashClosing.findUnique.mockResolvedValue({ id: "existing" });

      await expect(service.close("tenant-1", "user-1")).rejects.toThrow(
        "La caja de hoy ya fue cerrada",
      );
      expect(prisma.cashClosing.create).not.toHaveBeenCalled();
    });
  });

  describe("findClosings", () => {
    it("lista los cortes del tenant ordenados por fecha descendente", async () => {
      prisma.cashClosing.findMany.mockResolvedValue([
        {
          id: "c1",
          date: new Date("2026-08-15"),
          income: 300,
          expense: 50,
          balance: 250,
          createdAt: new Date(),
          closedBy: { id: "user-1", name: "Ana" },
        },
      ]);

      const result = await service.findClosings("tenant-1");

      expect(prisma.cashClosing.findMany).toHaveBeenCalledWith({
        where: { tenantId: "tenant-1" },
        include: { closedBy: true },
        orderBy: { date: "desc" },
      });
      expect(result).toEqual([expect.objectContaining({ id: "c1", balance: 250 })]);
    });
  });

  describe("findClosingByDate", () => {
    it("rechaza una fecha inválida", async () => {
      await expect(service.findClosingByDate("tenant-1", "no-es-una-fecha")).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it("lanza NotFoundException si ese día no se cerró la caja", async () => {
      prisma.cashClosing.findUnique.mockResolvedValue(null);
      prisma.cashMovement.findMany.mockResolvedValue([]);

      await expect(service.findClosingByDate("tenant-1", "2026-08-10")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("devuelve el snapshot guardado + los movimientos de ese día", async () => {
      prisma.cashClosing.findUnique.mockResolvedValue({
        id: "c1",
        date: new Date("2026-08-10"),
        income: 300,
        expense: 50,
        balance: 250,
        createdAt: new Date(),
        closedBy: { id: "user-1", name: "Ana" },
      });
      prisma.cashMovement.findMany.mockResolvedValue([
        { id: "m1", type: "expense", amount: 50, description: "Insumos", createdAt: new Date() },
      ]);

      const result = await service.findClosingByDate("tenant-1", "2026-08-10");

      expect(result.balance).toBe(250);
      expect(result.movements).toHaveLength(1);
    });
  });

  describe("getReport", () => {
    it("rechaza un rango inválido (from posterior a to)", async () => {
      await expect(service.getReport("tenant-1", "2026-08-10", "2026-08-05")).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it("rechaza fechas mal formadas", async () => {
      await expect(service.getReport("tenant-1", "no-es-fecha", "2026-08-05")).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it("desglosa ventas en efectivo y movimientos por día calendario", async () => {
      prisma.sale.findMany.mockResolvedValue([
        { total: 100, createdAt: new Date(2026, 7, 1, 10, 0) },
        { total: 50, createdAt: new Date(2026, 7, 2, 11, 0) },
      ]);
      prisma.cashMovement.findMany.mockResolvedValue([
        {
          id: "m1",
          type: "expense",
          amount: 20,
          description: "Insumos",
          createdAt: new Date(2026, 7, 1, 12, 0),
        },
      ]);

      const result = await service.getReport("tenant-1", "2026-08-01", "2026-08-02");

      expect(result.days).toHaveLength(2);
      expect(result.days[0]).toMatchObject({ income: 100, expense: 20, balance: 80 });
      expect(result.days[0].movements).toHaveLength(1);
      expect(result.days[1]).toMatchObject({ income: 50, expense: 0, balance: 50 });
      expect(result.income).toBe(150);
      expect(result.expense).toBe(20);
      expect(result.balance).toBe(130);
    });

    it("incluye días sin actividad en el desglose, en cero", async () => {
      prisma.sale.findMany.mockResolvedValue([]);
      prisma.cashMovement.findMany.mockResolvedValue([]);

      const result = await service.getReport("tenant-1", "2026-08-01", "2026-08-03");

      expect(result.days).toHaveLength(3);
      expect(result.days.every((d) => d.income === 0 && d.expense === 0)).toBe(true);
    });

    it("rechaza un rango de más de un año", async () => {
      prisma.sale.findMany.mockResolvedValue([]);
      prisma.cashMovement.findMany.mockResolvedValue([]);

      await expect(service.getReport("tenant-1", "2025-01-01", "2026-12-31")).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
