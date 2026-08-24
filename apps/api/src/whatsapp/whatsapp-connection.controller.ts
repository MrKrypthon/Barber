import { Body, Controller, Delete, Get, Put, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthenticatedUser } from "../auth/types/jwt-payload.type";
import { UpdateWhatsAppConnectionDto } from "./dto/update-whatsapp-connection.dto";
import { WhatsAppConnectionService } from "./whatsapp-connection.service";

// Exclusivo del owner, igual que Empleados/Configuración de colores — son
// credenciales sensibles de la cuenta de WhatsApp Business del negocio.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.owner)
@Controller("whatsapp/connection")
export class WhatsAppConnectionController {
  constructor(private readonly whatsAppConnectionService: WhatsAppConnectionService) {}

  @Get()
  get(@CurrentUser() user: AuthenticatedUser) {
    return this.whatsAppConnectionService.get(user.tenantId);
  }

  @Put()
  upsert(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateWhatsAppConnectionDto) {
    return this.whatsAppConnectionService.upsert(user.tenantId, dto);
  }

  @Delete()
  async remove(@CurrentUser() user: AuthenticatedUser) {
    await this.whatsAppConnectionService.remove(user.tenantId);
    return { success: true };
  }
}
