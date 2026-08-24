import { Injectable, NotFoundException } from "@nestjs/common";
import { PaymentMethod, Role, SubscriptionStatus, Tenant, TenantPayment, User } from "@prisma/client";
import { parseDateParam } from "../common/utils/date-range.util";
import { PrismaService } from "../prisma/prisma.service";
import { RecordTenantPaymentDto } from "./dto/record-tenant-payment.dto";

// Nunca se incluye nada de las relaciones de negocio del tenant (customers,
// sales, appointments, etc.) — este archivo es la única puerta de entrada
// del SuperAdmin a la tabla tenants, y estos son los únicos campos que
// expone. Ver comentario en schema.prisma sobre Tenant.
export type TenantSummaryResponse = {
  id: string;
  name: string;
  ownerName: string | null;
  ownerEmail: string | null;
  createdAt: Date;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPaidUntil: Date | null;
};

export type TenantPaymentResponse = {
  id: string;
  amount: number;
  method: PaymentMethod;
  paidUntil: Date;
  note: string | null;
  createdAt: Date;
};

export type TenantDetailResponse = TenantSummaryResponse & {
  payments: TenantPaymentResponse[];
};

type TenantWithOwner = Tenant & { users: User[] };

function toTenantSummaryResponse(tenant: TenantWithOwner): TenantSummaryResponse {
  const owner = tenant.users[0] ?? null;
  return {
    id: tenant.id,
    name: tenant.name,
    ownerName: owner?.name ?? null,
    ownerEmail: owner?.email ?? null,
    createdAt: tenant.createdAt,
    subscriptionStatus: tenant.subscriptionStatus,
    subscriptionPaidUntil: tenant.subscriptionPaidUntil,
  };
}

function toTenantPaymentResponse(payment: TenantPayment): TenantPaymentResponse {
  return {
    id: payment.id,
    amount: Number(payment.amount),
    method: payment.method,
    paidUntil: payment.paidUntil,
    note: payment.note,
    createdAt: payment.createdAt,
  };
}

@Injectable()
export class SuperAdminTenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<TenantSummaryResponse[]> {
    const tenants = await this.prisma.tenant.findMany({
      include: { users: { where: { role: Role.owner, deletedAt: null }, take: 1 } },
      orderBy: { createdAt: "desc" },
    });
    return tenants.map(toTenantSummaryResponse);
  }

  async findOne(id: string): Promise<TenantDetailResponse> {
    const tenant = await this.findExisting(id);
    const payments = await this.prisma.tenantPayment.findMany({
      where: { tenantId: id },
      orderBy: { createdAt: "desc" },
    });

    return { ...toTenantSummaryResponse(tenant), payments: payments.map(toTenantPaymentResponse) };
  }

  // Suspende el acceso: bloquea logins nuevos (AuthService.login) e invalida
  // de una las sesiones ya abiertas de todos los usuarios del tenant,
  // incrementando su tokenVersion — mismo mecanismo que ya usa
  // EmployeesService para dar de baja a un empleado.
  async suspend(id: string): Promise<TenantSummaryResponse> {
    await this.findExisting(id);

    const [tenant] = await this.prisma.$transaction([
      this.prisma.tenant.update({
        where: { id },
        data: { subscriptionStatus: SubscriptionStatus.suspended },
        include: { users: { where: { role: Role.owner, deletedAt: null }, take: 1 } },
      }),
      this.prisma.user.updateMany({
        where: { tenantId: id },
        data: { tokenVersion: { increment: 1 } },
      }),
    ]);

    return toTenantSummaryResponse(tenant);
  }

  // Reactivación manual sin pago de por medio (ej. cortesía). Registrar un
  // pago (abajo) también reactiva, para el caso normal.
  async activate(id: string): Promise<TenantSummaryResponse> {
    await this.findExisting(id);
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: { subscriptionStatus: SubscriptionStatus.active },
      include: { users: { where: { role: Role.owner, deletedAt: null }, take: 1 } },
    });
    return toTenantSummaryResponse(tenant);
  }

  async recordPayment(id: string, dto: RecordTenantPaymentDto): Promise<TenantDetailResponse> {
    await this.findExisting(id);
    const paidUntil = parseDateParam(dto.paidUntil);

    await this.prisma.$transaction([
      this.prisma.tenantPayment.create({
        data: {
          tenantId: id,
          amount: dto.amount,
          method: dto.method,
          paidUntil,
          note: dto.note,
        },
      }),
      this.prisma.tenant.update({
        where: { id },
        data: {
          subscriptionPaidUntil: paidUntil,
          subscriptionStatus: SubscriptionStatus.active,
        },
      }),
    ]);

    return this.findOne(id);
  }

  private async findExisting(id: string): Promise<TenantWithOwner> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { users: { where: { role: Role.owner, deletedAt: null }, take: 1 } },
    });
    if (!tenant) {
      throw new NotFoundException("Negocio no encontrado");
    }
    return tenant;
  }
}
