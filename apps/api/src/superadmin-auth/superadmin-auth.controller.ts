import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CurrentSuperAdmin } from "./decorators/current-superadmin.decorator";
import { SuperAdminLoginDto } from "./dto/superadmin-login.dto";
import { SuperAdminRefreshDto } from "./dto/superadmin-refresh.dto";
import { SuperAdminJwtAuthGuard } from "./guards/superadmin-jwt-auth.guard";
import { SuperAdminAuthService } from "./superadmin-auth.service";
import { AuthenticatedSuperAdmin } from "./types/superadmin-jwt-payload.type";

// Sin /register acá a propósito: no hay alta propia, la única cuenta se crea
// con el script de seed (apps/api/prisma/seed-superadmin.ts).
@Controller("superadmin/auth")
export class SuperAdminAuthController {
  constructor(private readonly superAdminAuthService: SuperAdminAuthService) {}

  @Post("login")
  login(@Body() dto: SuperAdminLoginDto) {
    return this.superAdminAuthService.login(dto);
  }

  @Post("refresh")
  refresh(@Body() dto: SuperAdminRefreshDto) {
    return this.superAdminAuthService.refresh(dto);
  }

  @UseGuards(SuperAdminJwtAuthGuard)
  @Post("logout")
  async logout(@CurrentSuperAdmin() superAdmin: AuthenticatedSuperAdmin) {
    await this.superAdminAuthService.logout(superAdmin.superAdminId);
    return { success: true };
  }

  @UseGuards(SuperAdminJwtAuthGuard)
  @Get("me")
  me(@CurrentSuperAdmin() superAdmin: AuthenticatedSuperAdmin) {
    return this.superAdminAuthService.me(superAdmin.superAdminId);
  }
}
