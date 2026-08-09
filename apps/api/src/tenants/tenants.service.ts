import { Injectable } from "@nestjs/common";
import { Prisma, Tenant } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    name: string,
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<Tenant> {
    return tx.tenant.create({ data: { name } });
  }
}
