import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthenticatedUser } from "../auth/types/jwt-payload.type";
import { DateRangeQueryDto } from "../common/dto/date-range-query.dto";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { SalesService } from "./sales.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("sales")
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // Owner y Employee pueden registrar ventas (docs/TECHNOLOGIES.md §17).
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSaleDto) {
    return this.salesService.create(user.tenantId, { userId: user.userId, role: user.role }, dto);
  }

  // Solo Owner puede consultar el historial (docs/TECHNOLOGIES.md §17:
  // "Consultar ventas" está listado solo para Owner).
  @Roles(Role.owner)
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: DateRangeQueryDto) {
    return this.salesService.findAll(user.tenantId, query.range);
  }

  @Roles(Role.owner)
  @Get(":id")
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.salesService.findOne(user.tenantId, id);
  }
}
