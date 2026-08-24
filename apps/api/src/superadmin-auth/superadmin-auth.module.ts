import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { seconds, ThrottlerModule } from "@nestjs/throttler";
import { JwtSuperAdminStrategy } from "./strategies/jwt-superadmin.strategy";
import { SuperAdminAuthController } from "./superadmin-auth.controller";
import { SuperAdminAuthService } from "./superadmin-auth.service";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    // Solo lo usa /superadmin/auth/login — no hay guard global.
    ThrottlerModule.forRoot([{ ttl: seconds(60), limit: 5 }]),
  ],
  controllers: [SuperAdminAuthController],
  providers: [SuperAdminAuthService, JwtSuperAdminStrategy],
  exports: [SuperAdminAuthService],
})
export class SuperAdminAuthModule {}
