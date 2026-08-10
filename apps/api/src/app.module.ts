import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { CashModule } from "./cash/cash.module";
import { CustomersModule } from "./customers/customers.module";
import { HealthController } from "./health/health.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { SalesModule } from "./sales/sales.module";
import { ServicesModule } from "./services/services.module";
import { TenantsModule } from "./tenants/tenants.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", ".env"],
    }),
    PrismaModule,
    TenantsModule,
    UsersModule,
    AuthModule,
    CustomersModule,
    ServicesModule,
    SalesModule,
    CashModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
