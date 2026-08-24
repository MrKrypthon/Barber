import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppointmentsModule } from "./appointments/appointments.module";
import { AuthModule } from "./auth/auth.module";
import { CashModule } from "./cash/cash.module";
import { CustomersModule } from "./customers/customers.module";
import { EmployeesModule } from "./employees/employees.module";
import { HealthController } from "./health/health.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { ProductsModule } from "./products/products.module";
import { SalesModule } from "./sales/sales.module";
import { ServicesModule } from "./services/services.module";
import { SettingsModule } from "./settings/settings.module";
import { SuperAdminAuthModule } from "./superadmin-auth/superadmin-auth.module";
import { SuperAdminTenantsModule } from "./superadmin-tenants/superadmin-tenants.module";
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
    EmployeesModule,
    ServicesModule,
    SalesModule,
    CashModule,
    ProductsModule,
    SettingsModule,
    AppointmentsModule,
    SuperAdminAuthModule,
    SuperAdminTenantsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
