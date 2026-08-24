import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../../prisma/prisma.service";
import {
  AuthenticatedSuperAdmin,
  SuperAdminAccessTokenPayload,
} from "../types/superadmin-jwt-payload.type";

// Nombre de estrategia distinto ("jwt-superadmin" vs "jwt") y secreto propio
// (SUPERADMIN_JWT_SECRET, nunca JWT_SECRET) — un token de negocio no puede
// validarse acá aunque alguien lo intente, y viceversa.
@Injectable()
export class JwtSuperAdminStrategy extends PassportStrategy(Strategy, "jwt-superadmin") {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("SUPERADMIN_JWT_SECRET"),
    });
  }

  async validate(payload: SuperAdminAccessTokenPayload): Promise<AuthenticatedSuperAdmin> {
    const superAdmin = await this.prisma.superAdmin.findUnique({ where: { id: payload.sub } });

    if (!superAdmin || superAdmin.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException("Sesión inválida o revocada");
    }

    return { superAdminId: superAdmin.id };
  }
}
