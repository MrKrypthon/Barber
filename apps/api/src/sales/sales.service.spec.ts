import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SalesService } from "./sales.service";

describe("SalesService", () => {
  let service: SalesService;
  let prisma: {
    customer: { findFirst: jest.Mock };
    service: { findMany: jest.Mock };
    sale: { create: jest.Mock; findMany: jest.Mock; findFirst: jest.Mock };
    user: { findFirst: jest.Mock };
  };

  const employee = { id: "user-1", name: "Ada" };
  const owner = { userId: "user-1", role: Role.owner };
  const customer = { id: "cust-1", name: "Juan" };
  const serviceA = { id: "svc-1", tenantId: "tenant-1", name: "Corte", price: 100 };
  const serviceB = { id: "svc-2", tenantId: "tenant-1", name: "Barba", price: 50 };

  function saleFixture(overrides: Record<string, unknown> = {}) {
    return {
      id: "sale-1",
      tenantId: "tenant-1",
      customerId: customer.id,
      employeeId: employee.id,
      paymentMethod: "cash",
      total: 150,
      createdAt: new Date(),
      customer,
      employee,
      items: [
        { serviceId: serviceA.id, price: serviceA.price, service: serviceA },
        { serviceId: serviceB.id, price: serviceB.price, service: serviceB },
      ],
      ...overrides,
    };
  }

  beforeEach(() => {
    prisma = {
      customer: { findFirst: jest.fn() },
      service: { findMany: jest.fn() },
      sale: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
      user: { findFirst: jest.fn() },
    };
    service = new SalesService(prisma as unknown as PrismaService);
  });

  describe("create", () => {
    it("calcula el total a partir del precio actual de los servicios, no de un valor del cliente", async () => {
      prisma.customer.findFirst.mockResolvedValue(customer);
      prisma.service.findMany.mockResolvedValue([serviceA, serviceB]);
      prisma.sale.create.mockResolvedValue(saleFixture());

      await service.create("tenant-1", owner, {
        customerId: customer.id,
        serviceIds: [serviceA.id, serviceB.id],
        paymentMethod: "cash",
      } as never);

      expect(prisma.sale.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: "tenant-1",
          employeeId: employee.id,
          total: 150,
          items: {
            create: [
              { serviceId: serviceA.id, price: serviceA.price },
              { serviceId: serviceB.id, price: serviceB.price },
            ],
          },
        }),
        include: expect.anything(),
      });
    });

    it("rechaza si el cliente pertenece a otro tenant", async () => {
      prisma.customer.findFirst.mockResolvedValue(null);

      await expect(
        service.create("tenant-1", owner, {
          customerId: "cust-de-otro-tenant",
          serviceIds: [serviceA.id],
          paymentMethod: "cash",
        } as never),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.sale.create).not.toHaveBeenCalled();
    });

    it("rechaza si algún servicio no pertenece al tenant", async () => {
      prisma.service.findMany.mockResolvedValue([serviceA]);

      await expect(
        service.create("tenant-1", owner, {
          serviceIds: [serviceA.id, "svc-de-otro-tenant"],
          paymentMethod: "cash",
        } as never),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.sale.create).not.toHaveBeenCalled();
    });

    it("permite repetir un servicio (dos personas, mismo corte) y suma su precio dos veces", async () => {
      prisma.service.findMany.mockResolvedValue([serviceA]);
      prisma.sale.create.mockResolvedValue(saleFixture({ total: 200 }));

      await service.create("tenant-1", owner, {
        serviceIds: [serviceA.id, serviceA.id],
        paymentMethod: "cash",
      } as never);

      expect(prisma.sale.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          total: 200,
          items: {
            create: [
              { serviceId: serviceA.id, price: serviceA.price },
              { serviceId: serviceA.id, price: serviceA.price },
            ],
          },
        }),
        include: expect.anything(),
      });
    });
  });

  describe("asignar la venta a otro empleado", () => {
    const otherEmployee = { id: "user-2", name: "Beto" };

    it("el owner puede asignar la venta a otro empleado del tenant", async () => {
      prisma.service.findMany.mockResolvedValue([serviceA]);
      prisma.user.findFirst.mockResolvedValue(otherEmployee);
      prisma.sale.create.mockResolvedValue(saleFixture({ employeeId: otherEmployee.id }));

      await service.create("tenant-1", owner, {
        serviceIds: [serviceA.id],
        paymentMethod: "cash",
        employeeId: otherEmployee.id,
      } as never);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: otherEmployee.id, tenantId: "tenant-1", deletedAt: null },
      });
      expect(prisma.sale.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ employeeId: otherEmployee.id }) }),
      );
    });

    it("un empleado no puede asignar la venta a otro empleado", async () => {
      prisma.service.findMany.mockResolvedValue([serviceA]);

      await expect(
        service.create(
          "tenant-1",
          { userId: employee.id, role: Role.employee },
          {
            serviceIds: [serviceA.id],
            paymentMethod: "cash",
            employeeId: otherEmployee.id,
          } as never,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.sale.create).not.toHaveBeenCalled();
    });

    it("rechaza si el empleado asignado no pertenece al tenant (o está dado de baja)", async () => {
      prisma.service.findMany.mockResolvedValue([serviceA]);
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.create("tenant-1", owner, {
          serviceIds: [serviceA.id],
          paymentMethod: "cash",
          employeeId: "emp-de-otro-tenant",
        } as never),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.sale.create).not.toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("lanza NotFoundException si la venta pertenece a otro tenant", async () => {
      prisma.sale.findFirst.mockResolvedValue(null);

      await expect(service.findOne("tenant-1", "sale-de-otro-tenant")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("findAll", () => {
    it("aplica el filtro de rango de fechas cuando se especifica", async () => {
      prisma.sale.findMany.mockResolvedValue([]);

      await service.findAll("tenant-1", "today");

      expect(prisma.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: "tenant-1", createdAt: expect.anything() }),
        }),
      );
    });

    it("no filtra por fecha si no se especifica rango ni since", async () => {
      prisma.sale.findMany.mockResolvedValue([]);

      await service.findAll("tenant-1");

      expect(prisma.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: "tenant-1" } }),
      );
    });

    it("since filtra desde esa fecha en vez de traer todo el historial", async () => {
      prisma.sale.findMany.mockResolvedValue([]);

      await service.findAll("tenant-1", undefined, "2026-06-01");

      expect(prisma.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: "tenant-1", createdAt: { gte: new Date(2026, 5, 1) } },
        }),
      );
    });
  });
});
