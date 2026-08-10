import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { DateRange, getDateRangeBounds } from "../common/utils/date-range.util";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSaleDto } from "./dto/create-sale.dto";

const SALE_INCLUDE = {
  customer: true,
  employee: true,
  items: { include: { service: true } },
} satisfies Prisma.SaleInclude;

type SaleWithRelations = Prisma.SaleGetPayload<{ include: typeof SALE_INCLUDE }>;

export type SaleResponse = {
  id: string;
  customer: { id: string; name: string } | null;
  employee: { id: string; name: string };
  paymentMethod: string;
  total: number;
  items: { serviceId: string; serviceName: string; price: number }[];
  createdAt: Date;
};

function toSaleResponse(sale: SaleWithRelations): SaleResponse {
  return {
    id: sale.id,
    customer: sale.customer ? { id: sale.customer.id, name: sale.customer.name } : null,
    employee: { id: sale.employee.id, name: sale.employee.name },
    paymentMethod: sale.paymentMethod,
    total: Number(sale.total),
    items: sale.items.map((item) => ({
      serviceId: item.serviceId,
      serviceName: item.service.name,
      price: Number(item.price),
    })),
    createdAt: sale.createdAt,
  };
}

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, employeeId: string, dto: CreateSaleDto): Promise<SaleResponse> {
    if (dto.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: dto.customerId, tenantId, deletedAt: null },
      });
      if (!customer) {
        throw new NotFoundException("Cliente no encontrado");
      }
    }

    // dto.serviceIds puede repetir un id (misma persona con dos cortes en
    // una sola venta); se valida contra el conjunto único de ids pedidos.
    const uniqueServiceIds = [...new Set(dto.serviceIds)];
    const services = await this.prisma.service.findMany({
      where: { id: { in: uniqueServiceIds }, tenantId, deletedAt: null },
    });

    if (services.length !== uniqueServiceIds.length) {
      throw new NotFoundException("Uno o más servicios no existen");
    }

    const serviceById = new Map(services.map((service) => [service.id, service]));

    // El total y el precio de cada item se calculan aquí, a partir del
    // precio actual del servicio en BD — nunca se confía en un total
    // enviado por el cliente (mismo principio que el tenant_id, CLAUDE.md §5).
    const items = dto.serviceIds.map((serviceId) => {
      const service = serviceById.get(serviceId);
      if (!service) {
        throw new NotFoundException("Uno o más servicios no existen");
      }
      return { serviceId, price: service.price };
    });
    const total = items.reduce((sum, item) => sum + Number(item.price), 0);

    const sale = await this.prisma.sale.create({
      data: {
        tenantId,
        customerId: dto.customerId ?? null,
        employeeId,
        paymentMethod: dto.paymentMethod,
        total,
        items: { create: items },
      },
      include: SALE_INCLUDE,
    });

    return toSaleResponse(sale);
  }

  async findAll(tenantId: string, range?: DateRange): Promise<SaleResponse[]> {
    const bounds = getDateRangeBounds(range);
    const where: Prisma.SaleWhereInput = {
      tenantId,
      ...(bounds ? { createdAt: { gte: bounds.start, lt: bounds.end } } : {}),
    };

    const sales = await this.prisma.sale.findMany({
      where,
      include: SALE_INCLUDE,
      orderBy: { createdAt: "desc" },
    });

    return sales.map(toSaleResponse);
  }

  async findOne(tenantId: string, id: string): Promise<SaleResponse> {
    const sale = await this.prisma.sale.findFirst({
      where: { id, tenantId },
      include: SALE_INCLUDE,
    });
    if (!sale) {
      throw new NotFoundException("Venta no encontrada");
    }
    return toSaleResponse(sale);
  }
}
