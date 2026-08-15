import { ConflictException, NotFoundException } from "@nestjs/common";
import { Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";
import { EmployeesService } from "./employees.service";

describe("EmployeesService", () => {
  let service: EmployeesService;
  let prisma: {
    user: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };
  let usersService: { emailIsTaken: jest.Mock; create: jest.Mock };

  const baseEmployee = {
    id: "emp-1",
    tenantId: "tenant-1",
    name: "Carla",
    email: "carla@example.com",
    password: "hashed",
    role: Role.employee,
    tokenVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(() => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    usersService = { emailIsTaken: jest.fn(), create: jest.fn() };
    service = new EmployeesService(
      prisma as unknown as PrismaService,
      usersService as unknown as UsersService,
    );
  });

  describe("findAll", () => {
    it("solo trae empleados del tenant, sin dar de baja", async () => {
      prisma.user.findMany.mockResolvedValue([baseEmployee]);

      const result = await service.findAll("tenant-1");

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { tenantId: "tenant-1", role: Role.employee, deletedAt: null },
        orderBy: { name: "asc" },
      });
      expect(result).toEqual([expect.objectContaining({ id: "emp-1", name: "Carla" })]);
      expect(result[0]).not.toHaveProperty("password");
    });
  });

  describe("create", () => {
    it("rechaza si el correo ya existe (activo o dado de baja)", async () => {
      usersService.emailIsTaken.mockResolvedValue(true);

      await expect(
        service.create("tenant-1", { name: "Carla", email: "carla@example.com", password: "supersecret" }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it("crea el empleado con role=employee en el tenant del dueño", async () => {
      usersService.emailIsTaken.mockResolvedValue(false);
      usersService.create.mockResolvedValue(baseEmployee);

      await service.create("tenant-1", {
        name: "Carla",
        email: "carla@example.com",
        password: "supersecret",
      });

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: "tenant-1", role: Role.employee }),
      );
    });
  });

  describe("aislamiento de tenant", () => {
    it("update lanza NotFoundException si el empleado pertenece a otro tenant", async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.update("tenant-1", "emp-de-otro-tenant", { name: "Hackeado" }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("remove lanza NotFoundException si el empleado pertenece a otro tenant", async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.remove("tenant-1", "emp-de-otro-tenant")).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("hace baja lógica e invalida sesiones (deletedAt + tokenVersion++)", async () => {
      prisma.user.findFirst.mockResolvedValue(baseEmployee);
      prisma.user.update.mockResolvedValue({ ...baseEmployee, deletedAt: new Date() });

      await service.remove("tenant-1", "emp-1");

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "emp-1" },
        data: { deletedAt: expect.any(Date), tokenVersion: { increment: 1 } },
      });
    });
  });
});
