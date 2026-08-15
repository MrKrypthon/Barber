import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AppointmentsService } from "./appointments.service";

describe("AppointmentsService", () => {
  let service: AppointmentsService;
  let prisma: {
    appointment: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    customer: { findFirst: jest.Mock };
    service: { findFirst: jest.Mock };
    user: { findFirst: jest.Mock };
  };

  const baseAppointment = {
    id: "appt-1",
    tenantId: "tenant-1",
    customerId: "cust-1",
    serviceId: "svc-1",
    employeeId: "user-1",
    startAt: new Date("2026-08-11T15:00:00.000Z"),
    durationMinutes: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    customer: { id: "cust-1", name: "Juan" },
    service: { id: "svc-1", name: "Corte", color: "#000000" },
    employee: { id: "user-1", name: "Ana" },
  };

  beforeEach(() => {
    prisma = {
      appointment: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      customer: { findFirst: jest.fn() },
      service: { findFirst: jest.fn() },
      user: { findFirst: jest.fn() },
    };
    service = new AppointmentsService(prisma as unknown as PrismaService);
  });

  describe("findAll", () => {
    it("escopa la consulta al tenant y excluye eliminados", async () => {
      prisma.appointment.findMany.mockResolvedValue([baseAppointment]);

      const result = await service.findAll("tenant-1");

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: "tenant-1", deletedAt: null }),
        }),
      );
      expect(result).toEqual([expect.objectContaining({ id: "appt-1" })]);
    });
  });

  describe("create", () => {
    it("crea el turno con la duración copiada del servicio", async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: "cust-1", tenantId: "tenant-1" });
      prisma.service.findFirst.mockResolvedValue({
        id: "svc-1",
        tenantId: "tenant-1",
        durationMinutes: 30,
      });
      prisma.user.findFirst.mockResolvedValue({ id: "user-1", tenantId: "tenant-1" });
      prisma.appointment.findMany.mockResolvedValue([]);
      prisma.appointment.create.mockResolvedValue(baseAppointment);

      await service.create("tenant-1", "user-1", {
        customerId: "cust-1",
        serviceId: "svc-1",
        startAt: "2026-08-11T15:00:00.000Z",
      });

      expect(prisma.appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: "tenant-1",
            employeeId: "user-1",
            durationMinutes: 30,
          }),
        }),
      );
    });

    it("usa el usuario autenticado como empleado si no se especifica uno", async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: "cust-1", tenantId: "tenant-1" });
      prisma.service.findFirst.mockResolvedValue({
        id: "svc-1",
        tenantId: "tenant-1",
        durationMinutes: 30,
      });
      prisma.user.findFirst.mockResolvedValue({ id: "user-1", tenantId: "tenant-1" });
      prisma.appointment.findMany.mockResolvedValue([]);
      prisma.appointment.create.mockResolvedValue(baseAppointment);

      await service.create("tenant-1", "user-1", {
        customerId: "cust-1",
        serviceId: "svc-1",
        startAt: "2026-08-11T15:00:00.000Z",
      });

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: "user-1", tenantId: "tenant-1", deletedAt: null },
      });
    });

    it("lanza BadRequestException si el servicio no tiene duración configurada", async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: "cust-1", tenantId: "tenant-1" });
      prisma.service.findFirst.mockResolvedValue({
        id: "svc-1",
        tenantId: "tenant-1",
        durationMinutes: null,
      });

      await expect(
        service.create("tenant-1", "user-1", {
          customerId: "cust-1",
          serviceId: "svc-1",
          startAt: "2026-08-11T15:00:00.000Z",
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.appointment.create).not.toHaveBeenCalled();
    });

    it("lanza ConflictException si el empleado ya tiene un turno que se solapa", async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: "cust-1", tenantId: "tenant-1" });
      prisma.service.findFirst.mockResolvedValue({
        id: "svc-1",
        tenantId: "tenant-1",
        durationMinutes: 30,
      });
      prisma.user.findFirst.mockResolvedValue({ id: "user-1", tenantId: "tenant-1" });
      prisma.appointment.findMany.mockResolvedValue([
        {
          id: "appt-other",
          employeeId: "user-1",
          startAt: new Date("2026-08-11T15:15:00.000Z"),
          durationMinutes: 30,
        },
      ]);

      await expect(
        service.create("tenant-1", "user-1", {
          customerId: "cust-1",
          serviceId: "svc-1",
          startAt: "2026-08-11T15:00:00.000Z",
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.appointment.create).not.toHaveBeenCalled();
    });
  });

  describe("aislamiento de tenant", () => {
    it("update lanza NotFoundException si el turno pertenece a otro tenant", async () => {
      prisma.appointment.findFirst.mockResolvedValue(null);

      await expect(
        service.update("tenant-1", "appt-de-otro-tenant", { startAt: "2026-08-11T16:00:00.000Z" }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.appointment.update).not.toHaveBeenCalled();
    });

    it("remove lanza NotFoundException si el turno pertenece a otro tenant", async () => {
      prisma.appointment.findFirst.mockResolvedValue(null);

      await expect(service.remove("tenant-1", "appt-de-otro-tenant")).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.appointment.update).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("hace soft delete (deletedAt) en vez de borrar el registro", async () => {
      prisma.appointment.findFirst.mockResolvedValue(baseAppointment);
      prisma.appointment.update.mockResolvedValue({ ...baseAppointment, deletedAt: new Date() });

      await service.remove("tenant-1", "appt-1");

      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: "appt-1" },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
