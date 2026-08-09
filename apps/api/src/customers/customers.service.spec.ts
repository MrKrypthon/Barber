import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CustomersService } from "./customers.service";

describe("CustomersService", () => {
  let service: CustomersService;
  let prisma: {
    customer: {
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      findFirst: jest.Mock;
    };
  };

  const baseCustomer = {
    id: "cust-1",
    tenantId: "tenant-1",
    name: "Juan",
    phone: "555-0000",
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(() => {
    prisma = {
      customer: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
    };
    service = new CustomersService(prisma as unknown as PrismaService);
  });

  describe("findAll", () => {
    it("escopa la consulta al tenant y excluye eliminados", async () => {
      prisma.customer.findMany.mockResolvedValue([baseCustomer]);

      const result = await service.findAll("tenant-1");

      expect(prisma.customer.findMany).toHaveBeenCalledWith({
        where: { tenantId: "tenant-1", deletedAt: null },
        orderBy: { name: "asc" },
      });
      expect(result).toEqual([expect.objectContaining({ id: "cust-1", name: "Juan" })]);
    });
  });

  describe("create", () => {
    it("crea el cliente asociado al tenant del request", async () => {
      prisma.customer.create.mockResolvedValue(baseCustomer);

      await service.create("tenant-1", { name: "Juan", phone: "555-0000" });

      expect(prisma.customer.create).toHaveBeenCalledWith({
        data: { tenantId: "tenant-1", name: "Juan", phone: "555-0000", notes: undefined },
      });
    });
  });

  describe("aislamiento de tenant", () => {
    it("update lanza NotFoundException si el cliente pertenece a otro tenant", async () => {
      // findFirst filtra por { id, tenantId }: un cliente de otro tenant no
      // aparece aunque el id exista, exactamente como un 404.
      prisma.customer.findFirst.mockResolvedValue(null);

      await expect(
        service.update("tenant-1", "cust-de-otro-tenant", { name: "Hackeado" }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.customer.update).not.toHaveBeenCalled();
    });

    it("remove lanza NotFoundException si el cliente pertenece a otro tenant", async () => {
      prisma.customer.findFirst.mockResolvedValue(null);

      await expect(service.remove("tenant-1", "cust-de-otro-tenant")).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(prisma.customer.update).not.toHaveBeenCalled();
    });

    it("update funciona cuando el cliente sí pertenece al tenant", async () => {
      prisma.customer.findFirst.mockResolvedValue(baseCustomer);
      prisma.customer.update.mockResolvedValue({ ...baseCustomer, name: "Juan Actualizado" });

      const result = await service.update("tenant-1", "cust-1", { name: "Juan Actualizado" });

      expect(prisma.customer.findFirst).toHaveBeenCalledWith({
        where: { id: "cust-1", tenantId: "tenant-1", deletedAt: null },
      });
      expect(result.name).toBe("Juan Actualizado");
    });

    it("remove hace soft delete (deletedAt) en vez de borrar el registro", async () => {
      prisma.customer.findFirst.mockResolvedValue(baseCustomer);
      prisma.customer.update.mockResolvedValue({ ...baseCustomer, deletedAt: new Date() });

      await service.remove("tenant-1", "cust-1");

      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: "cust-1" },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
