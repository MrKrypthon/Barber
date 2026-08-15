import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Role, User } from "@prisma/client";
import { hashPassword } from "../auth/password.util";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";

export type EmployeeResponse = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AssignableStaffResponse = {
  id: string;
  name: string;
};

function toEmployeeResponse(user: User): EmployeeResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  // Solo empleados (no el propio owner): la gestión de "quién más trabaja
  // acá" es sobre el equipo, el dueño no se administra a sí mismo desde acá.
  async findAll(tenantId: string): Promise<EmployeeResponse[]> {
    const employees = await this.prisma.user.findMany({
      where: { tenantId, role: Role.employee, deletedAt: null },
      orderBy: { name: "asc" },
    });
    return employees.map(toEmployeeResponse);
  }

  // A diferencia de findAll, incluye al owner (también puede atender turnos
  // y ventas, docs/PROJECT.md) y es accesible para ambos roles — se usa para
  // el selector "¿quién atendió esto?" al agendar un turno o cobrar una venta.
  async findAssignable(tenantId: string): Promise<AssignableStaffResponse[]> {
    const staff = await this.prisma.user.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return staff;
  }

  async create(tenantId: string, dto: CreateEmployeeDto): Promise<EmployeeResponse> {
    if (await this.usersService.emailIsTaken(dto.email)) {
      throw new ConflictException("Ya existe una cuenta con este correo");
    }

    const passwordHash = await hashPassword(dto.password);
    const employee = await this.usersService.create({
      tenantId,
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: Role.employee,
    });

    return toEmployeeResponse(employee);
  }

  async update(tenantId: string, id: string, dto: UpdateEmployeeDto): Promise<EmployeeResponse> {
    const existing = await this.findOwned(tenantId, id);

    if (dto.email && dto.email !== existing.email && (await this.usersService.emailIsTaken(dto.email))) {
      throw new ConflictException("Ya existe una cuenta con este correo");
    }

    const employee = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        password: dto.password ? await hashPassword(dto.password) : undefined,
      },
    });

    return toEmployeeResponse(employee);
  }

  // Baja lógica (docs/DATABASE.md): puede estar referenciado por ventas o
  // turnos históricos. Además invalida cualquier refresh token ya emitido
  // (mismo mecanismo que logout) para que la baja corte el acceso ni bien
  // vence el access token vigente, sin esperar a que el empleado cierre sesión.
  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOwned(tenantId, id);
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), tokenVersion: { increment: 1 } },
    });
  }

  private async findOwned(tenantId: string, id: string): Promise<User> {
    const employee = await this.prisma.user.findFirst({
      where: { id, tenantId, role: Role.employee, deletedAt: null },
    });
    if (!employee) {
      throw new NotFoundException("Empleado no encontrado");
    }
    return employee;
  }
}
