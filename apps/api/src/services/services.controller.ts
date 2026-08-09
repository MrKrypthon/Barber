import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthenticatedUser } from "../auth/types/jwt-payload.type";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { ServicesService } from "./services.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("services")
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.servicesService.findAll(user.tenantId);
  }

  @Roles(Role.owner)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(user.tenantId, dto);
  }

  @Roles(Role.owner)
  @Put(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(user.tenantId, id, dto);
  }

  @Roles(Role.owner)
  @Delete(":id")
  async remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    await this.servicesService.remove(user.tenantId, id);
    return { success: true };
  }
}
