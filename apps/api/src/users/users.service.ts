import { Injectable } from "@nestjs/common";
import { Prisma, Role, Tenant, User } from "@prisma/client";
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

  // findFirst (no findUnique) porque se combina con deletedAt: null — un
  // empleado dado de baja no debe poder loguearse ni refrescar su sesión.
  // Incluye tenant para que AuthService.login pueda rechazar el acceso de
  // un negocio con la suscripción suspendida (panel de SuperAdmin).
  findByEmail(email: string): Promise<(User & { tenant: Tenant }) | null> {
    return this.prisma.user.findFirst({ where: { email, deletedAt: null }, include: { tenant: true } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  // El email es único a nivel de base de datos sin importar deletedAt (no se
  // libera al dar de baja a un empleado), por eso este chequeo de
  // disponibilidad no filtra por deletedAt como sí hacen findByEmail/findById.
  async emailIsTaken(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    return user !== null;
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
