import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthenticatedUser } from "../auth/types/jwt-payload.type";
import { DateRangeQueryDto } from "../common/dto/date-range-query.dto";
import { CashService } from "./cash.service";
import { CreateCashMovementDto } from "./dto/create-cash-movement.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("cash")
export class CashController {
  constructor(private readonly cashService: CashService) {}

  // Solo Owner puede consultar caja (docs/TECHNOLOGIES.md §17: "Consultar
  // caja" está listado solo para Owner).
  @Roles(Role.owner)
  @Get()
  getSummary(@CurrentUser() user: AuthenticatedUser, @Query() query: DateRangeQueryDto) {
    return this.cashService.getSummary(user.tenantId, query.range ?? "today");
  }

  // Historial de cortes ya hechos, para poder volver a descargar el PDF de
  // un día anterior (no solo el de hoy recién cerrado).
  @Roles(Role.owner)
  @Get("closings")
  findClosings(@CurrentUser() user: AuthenticatedUser) {
    return this.cashService.findClosings(user.tenantId);
  }

  @Roles(Role.owner)
  @Get("closings/:date")
  findClosingByDate(@CurrentUser() user: AuthenticatedUser, @Param("date") date: string) {
    return this.cashService.findClosingByDate(user.tenantId, date);
  }

  // Owner y Employee pueden registrar movimientos (docs/PROJECT.md: el
  // empleado registra gastos; TECHNOLOGIES.md §17 lo deja "según permisos",
  // que el MVP aún no modela con granularidad, así que se permite a ambos).
  @Post("movement")
  registerMovement(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCashMovementDto,
  ) {
    return this.cashService.registerMovement(user.tenantId, dto);
  }

  // Solo Owner, igual que consultar caja.
  @Roles(Role.owner)
  @Post("close")
  close(@CurrentUser() user: AuthenticatedUser) {
    return this.cashService.close(user.tenantId, user.userId);
  }
}
