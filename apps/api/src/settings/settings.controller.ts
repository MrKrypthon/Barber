import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthenticatedUser } from "../auth/types/jwt-payload.type";
import { UpdateSettingsDto } from "./dto/update-settings.dto";
import { SettingsService } from "./settings.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // Owner y Employee pueden ver la configuración del negocio (nombre,
  // colores) — la usa el sidebar de toda la app, no solo el owner.
  @Get()
  get(@CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.get(user.tenantId);
  }

  @Roles(Role.owner)
  @Put()
  update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(user.tenantId, dto);
  }
}
