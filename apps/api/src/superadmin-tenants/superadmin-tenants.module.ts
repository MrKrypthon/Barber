import { Module } from "@nestjs/common";
import { SuperAdminTenantsController } from "./superadmin-tenants.controller";
import { SuperAdminTenantsService } from "./superadmin-tenants.service";

@Module({
  controllers: [SuperAdminTenantsController],
  providers: [SuperAdminTenantsService],
})
export class SuperAdminTenantsModule {}
