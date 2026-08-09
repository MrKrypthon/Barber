import { Injectable, NotFoundException } from "@nestjs/common";
import { Customer } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";

export type CustomerResponse = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toCustomerResponse(customer: Customer): CustomerResponse {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    notes: customer.notes,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string): Promise<CustomerResponse[]> {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: "asc" },
    });
    return customers.map(toCustomerResponse);
  }

  async create(tenantId: string, dto: CreateCustomerDto): Promise<CustomerResponse> {
    const customer = await this.prisma.customer.create({
      data: { tenantId, name: dto.name, phone: dto.phone, notes: dto.notes },
    });
    return toCustomerResponse(customer);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateCustomerDto,
  ): Promise<CustomerResponse> {
    await this.findOwned(tenantId, id);
    const customer = await this.prisma.customer.update({
      where: { id },
      data: dto,
    });
    return toCustomerResponse(customer);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOwned(tenantId, id);
    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Nunca se confía en un id sin verificar que pertenece al tenant del
  // request; evita que un tenant acceda o modifique recursos de otro
  // (CLAUDE.md §5).
  private async findOwned(tenantId: string, id: string): Promise<Customer> {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!customer) {
      throw new NotFoundException("Cliente no encontrado");
    }
    return customer;
  }
}
