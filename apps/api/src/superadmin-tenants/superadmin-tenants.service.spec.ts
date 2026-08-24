import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SuperAdminTenantsService } from "./superadmin-tenants.service";

describe("SuperAdminTenantsService", () => {
  let service: SuperAdminTenantsService;
  let prisma: {
    tenant: { findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
    tenantPayment: { findMany: jest.Mock; create: jest.Mock };
    user: { updateMany: jest.Mock };
    $transaction: jest.Mock;
  };

  const owner = { id: "user-1", name: "Ana", email: "ana@example.com", role: "owner" };
  const baseTenant = {
    id: "tenant-1",
    name: "Mi Barbería",
    subscriptionStatus: "active",
    subscriptionPaidUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    users: [owner],
  };

  beforeEach(() => {
    prisma = {
      tenant: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      tenantPayment: { findMany: jest.fn(), create: jest.fn() },
      user: { updateMany: jest.fn() },
      // Mismo criterio que el resto de los specs con $transaction en array:
      // los "ops" ya son los valores resueltos, $transaction solo los envuelve.
      $transaction: jest.fn((ops: unknown[]) => Promise.resolve(ops)),
    };
    service = new SuperAdminTenantsService(prisma as unknown as PrismaService);
  });

  describe("findAll", () => {
    it("mapea el owner (primer user con role=owner) como contacto, nunca datos de negocio", async () => {
      prisma.tenant.findMany.mockResolvedValue([baseTenant]);

      const result = await service.findAll();

      expect(result).toEqual([
        expect.objectContaining({
          id: "tenant-1",
          ownerName: "Ana",
          ownerEmail: "ana@example.com",
          subscriptionStatus: "active",
        }),
      ]);
      // Nunca pide relaciones de negocio (customers/sales/etc.) — solo el
      // owner, para el contacto.
      expect(prisma.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { users: expect.objectContaining({ take: 1 }) },
        }),
      );
    });

    it("ownerName/ownerEmail quedan null si el tenant no tiene owner activo", async () => {
      prisma.tenant.findMany.mockResolvedValue([{ ...baseTenant, users: [] }]);

      const result = await service.findAll();

      expect(result[0]).toMatchObject({ ownerName: null, ownerEmail: null });
    });
  });

  describe("findOne", () => {
    it("lanza NotFoundException si el negocio no existe", async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.findOne("no-existe")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("devuelve el detalle con el historial de pagos", async () => {
      prisma.tenant.findUnique.mockResolvedValue(baseTenant);
      prisma.tenantPayment.findMany.mockResolvedValue([
        { id: "p1", amount: 500, method: "transfer", paidUntil: new Date(), note: "Agosto", createdAt: new Date() },
      ]);

      const result = await service.findOne("tenant-1");

      expect(result.payments).toHaveLength(1);
      expect(result.payments[0]).toMatchObject({ amount: 500, method: "transfer" });
    });
  });

  describe("suspend", () => {
    it("lanza NotFoundException si el negocio no existe", async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.suspend("no-existe")).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("suspende el tenant e invalida las sesiones de todos sus usuarios", async () => {
      prisma.tenant.findUnique.mockResolvedValue(baseTenant);
      prisma.tenant.update.mockReturnValue({ ...baseTenant, subscriptionStatus: "suspended" });
      prisma.user.updateMany.mockReturnValue({ count: 2 });

      const result = await service.suspend("tenant-1");

      expect(prisma.tenant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "tenant-1" },
          data: { subscriptionStatus: "suspended" },
        }),
      );
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { tenantId: "tenant-1" },
        data: { tokenVersion: { increment: 1 } },
      });
      expect(result.subscriptionStatus).toBe("suspended");
    });
  });

  describe("activate", () => {
    it("reactiva el tenant sin tocar tokenVersion de los usuarios", async () => {
      prisma.tenant.findUnique.mockResolvedValue({ ...baseTenant, subscriptionStatus: "suspended" });
      prisma.tenant.update.mockResolvedValue({ ...baseTenant, subscriptionStatus: "active" });

      const result = await service.activate("tenant-1");

      expect(prisma.tenant.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { subscriptionStatus: "active" } }),
      );
      expect(prisma.user.updateMany).not.toHaveBeenCalled();
      expect(result.subscriptionStatus).toBe("active");
    });
  });

  describe("recordPayment", () => {
    it("crea el pago, actualiza subscriptionPaidUntil y reactiva el tenant", async () => {
      prisma.tenant.findUnique
        .mockResolvedValueOnce({ ...baseTenant, subscriptionStatus: "suspended" }) // findExisting
        .mockResolvedValueOnce({ ...baseTenant, subscriptionStatus: "active" }); // findOne (dentro de recordPayment)
      prisma.tenantPayment.findMany.mockResolvedValue([]);

      await service.recordPayment("tenant-1", {
        amount: 1000,
        method: "cash",
        paidUntil: "2026-09-20",
      } as never);

      expect(prisma.tenantPayment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: "tenant-1", amount: 1000, method: "cash" }),
        }),
      );
      expect(prisma.tenant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "tenant-1" },
          data: expect.objectContaining({ subscriptionStatus: "active" }),
        }),
      );
    });
  });
});
