import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthenticatedUser } from "../auth/types/jwt-payload.type";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { EmployeesService } from "./employees.service";

// Gestión de empleados: exclusivo del owner (docs/PROJECT.md — el rol
// "Empleado" no tiene esta capacidad, "Nada más" que vender/consultar
// clientes/registrar gastos), por eso @Roles(owner) a nivel de clase.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.owner)
@Controller("employees")
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.employeesService.findAll(user.tenantId);
  }

  // Override del @Roles(owner) de la clase: cualquier usuario autenticado
  // necesita esta lista para elegir "quién atendió esto" al agendar un
  // turno o cobrar una venta (ambos roles pueden hacer ambas cosas).
  @Roles(Role.owner, Role.employee)
  @Get("assignable")
  findAssignable(@CurrentUser() user: AuthenticatedUser) {
    return this.employeesService.findAssignable(user.tenantId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(user.tenantId, dto);
  }

  @Put(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(user.tenantId, id, dto);
  }

  @Delete(":id")
  async remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    await this.employeesService.remove(user.tenantId, id);
    return { success: true };
  }
}
