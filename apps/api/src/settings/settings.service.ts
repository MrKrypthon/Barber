import { Injectable } from "@nestjs/common";
import { BusinessSettings, Tenant } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateSettingsDto } from "./dto/update-settings.dto";

export type SettingsResponse = {
  businessName: string;
  logo: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  backgroundColor: string | null;
  phone: string | null;
  address: string | null;
  scheduleDays: string[];
  scheduleOpen: string | null;
  scheduleClose: string | null;
};

function toSettingsResponse(tenant: Tenant, settings: BusinessSettings | null): SettingsResponse {
  return {
    businessName: tenant.name,
    logo: settings?.logo ?? null,
    primaryColor: settings?.primaryColor ?? null,
    secondaryColor: settings?.secondaryColor ?? null,
    backgroundColor: settings?.backgroundColor ?? null,
    phone: settings?.phone ?? null,
    address: settings?.address ?? null,
    scheduleDays: settings?.scheduleDays ?? [],
    scheduleOpen: settings?.scheduleOpen ?? null,
    scheduleClose: settings?.scheduleClose ?? null,
  };
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(tenantId: string): Promise<SettingsResponse> {
    const [tenant, settings] = await Promise.all([
      this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
      this.prisma.businessSettings.findUnique({ where: { tenantId } }),
    ]);
    return toSettingsResponse(tenant, settings);
  }

  // BusinessSettings es 1:1 con Tenant pero no se crea junto con él
  // (register() solo crea Tenant+User); upsert cubre tanto la primera
  // configuración como ediciones posteriores.
  async update(tenantId: string, dto: UpdateSettingsDto): Promise<SettingsResponse> {
    const { businessName, ...settingsFields } = dto;

    const [tenant, settings] = await Promise.all([
      businessName
        ? this.prisma.tenant.update({ where: { id: tenantId }, data: { name: businessName } })
        : this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
      this.prisma.businessSettings.upsert({
        where: { tenantId },
        create: { tenantId, ...settingsFields },
        update: settingsFields,
      }),
    ]);

    return toSettingsResponse(tenant, settings);
  }
}
