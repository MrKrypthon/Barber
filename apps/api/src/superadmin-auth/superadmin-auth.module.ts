import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtSuperAdminStrategy } from "./strategies/jwt-superadmin.strategy";
import { SuperAdminAuthController } from "./superadmin-auth.controller";
import { SuperAdminAuthService } from "./superadmin-auth.service";

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [SuperAdminAuthController],
  providers: [SuperAdminAuthService, JwtSuperAdminStrategy],
  exports: [SuperAdminAuthService],
})
export class SuperAdminAuthModule {}
