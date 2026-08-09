import { Injectable } from "@nestjs/common";
import { Prisma, Role, User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type CreateUserInput = {
  tenantId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(
    input: CreateUserInput,
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<User> {
    return tx.user.create({
      data: {
        tenantId: input.tenantId,
        name: input.name,
        email: input.email,
        password: input.passwordHash,
        role: input.role,
      },
    });
  }

  incrementTokenVersion(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
  }
}
