import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { seconds, ThrottlerModule } from "@nestjs/throttler";
import { TenantsModule } from "../tenants/tenants.module";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAccessStrategy } from "./strategies/jwt-access.strategy";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    TenantsModule,
    UsersModule,
    // Solo lo usa /auth/login (ver AuthController) — no hay guard global,
    // el resto de la API queda sin este límite.
    ThrottlerModule.forRoot([{ ttl: seconds(60), limit: 5 }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessStrategy],
  exports: [AuthService],
})
export class AuthModule {}
