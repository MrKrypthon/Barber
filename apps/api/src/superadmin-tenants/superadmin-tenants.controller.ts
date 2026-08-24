import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { SuperAdminJwtAuthGuard } from "../superadmin-auth/guards/superadmin-jwt-auth.guard";
import { RecordTenantPaymentDto } from "./dto/record-tenant-payment.dto";
import { SuperAdminTenantsService } from "./superadmin-tenants.service";

@UseGuards(SuperAdminJwtAuthGuard)
@Controller("superadmin/tenants")
export class SuperAdminTenantsController {
  constructor(private readonly superAdminTenantsService: SuperAdminTenantsService) {}

  @Get()
  findAll() {
    return this.superAdminTenantsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.superAdminTenantsService.findOne(id);
  }

  @Post(":id/suspend")
  suspend(@Param("id") id: string) {
    return this.superAdminTenantsService.suspend(id);
  }

  @Post(":id/activate")
  activate(@Param("id") id: string) {
    return this.superAdminTenantsService.activate(id);
  }

  @Post(":id/payments")
  recordPayment(@Param("id") id: string, @Body() dto: RecordTenantPaymentDto) {
    return this.superAdminTenantsService.recordPayment(id, dto);
  }
}
