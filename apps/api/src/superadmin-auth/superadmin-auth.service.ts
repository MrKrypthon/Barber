import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { SuperAdmin } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { SALT_ROUNDS } from "../auth/password.util";
import { PrismaService } from "../prisma/prisma.service";
import { SuperAdminLoginDto } from "./dto/superadmin-login.dto";
import { SuperAdminRefreshDto } from "./dto/superadmin-refresh.dto";
import { SuperAdminRefreshTokenPayload } from "./types/superadmin-jwt-payload.type";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "30d";

// Mismo motivo que en AuthService: bcrypt.compare siempre corre, exista o no
// la cuenta, para que el tiempo de respuesta no revele si un email es el del
// SuperAdmin.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("timing-attack-mitigation", SALT_ROUNDS);

export type SuperAdminAuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type PublicSuperAdmin = {
  id: string;
  name: string;
  email: string;
};

export type SuperAdminAuthResult = SuperAdminAuthTokens & { superAdmin: PublicSuperAdmin };

@Injectable()
export class SuperAdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: SuperAdminLoginDto): Promise<SuperAdminAuthResult> {
    const superAdmin = await this.prisma.superAdmin.findUnique({ where: { email: dto.email } });

    const passwordMatches = await bcrypt.compare(
      dto.password,
      superAdmin?.password ?? DUMMY_PASSWORD_HASH,
    );

    if (!superAdmin || !passwordMatches) {
      throw new UnauthorizedException("Credenciales inválidas");
    }

    return this.buildAuthResult(superAdmin);
  }

  async refresh(dto: SuperAdminRefreshDto): Promise<SuperAdminAuthTokens> {
    let payload: SuperAdminRefreshTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<SuperAdminRefreshTokenPayload>(dto.refreshToken, {
        secret: this.config.getOrThrow<string>("SUPERADMIN_JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Refresh token inválido");
    }

    const superAdmin = await this.prisma.superAdmin.findUnique({ where: { id: payload.sub } });
    if (!superAdmin || superAdmin.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException("Refresh token inválido");
    }

    // Rotación, mismo criterio que AuthService.refresh.
    const rotated = await this.prisma.superAdmin.update({
      where: { id: superAdmin.id },
      data: { tokenVersion: { increment: 1 } },
    });

    return {
      accessToken: this.signAccessToken(rotated),
      refreshToken: this.signRefreshToken(rotated),
    };
  }

  async logout(superAdminId: string): Promise<void> {
    await this.prisma.superAdmin.update({
      where: { id: superAdminId },
      data: { tokenVersion: { increment: 1 } },
    });
  }

  async me(superAdminId: string): Promise<PublicSuperAdmin> {
    const superAdmin = await this.prisma.superAdmin.findUnique({ where: { id: superAdminId } });
    if (!superAdmin) {
      throw new UnauthorizedException();
    }
    return this.toPublic(superAdmin);
  }

  private buildAuthResult(superAdmin: SuperAdmin): SuperAdminAuthResult {
    return {
      accessToken: this.signAccessToken(superAdmin),
      refreshToken: this.signRefreshToken(superAdmin),
      superAdmin: this.toPublic(superAdmin),
    };
  }

  private toPublic(superAdmin: SuperAdmin): PublicSuperAdmin {
    return { id: superAdmin.id, name: superAdmin.name, email: superAdmin.email };
  }

  private signAccessToken(superAdmin: SuperAdmin): string {
    return this.jwtService.sign(
      { sub: superAdmin.id, tokenVersion: superAdmin.tokenVersion },
      { secret: this.config.getOrThrow<string>("SUPERADMIN_JWT_SECRET"), expiresIn: ACCESS_TOKEN_TTL },
    );
  }

  private signRefreshToken(superAdmin: SuperAdmin): string {
    return this.jwtService.sign(
      { sub: superAdmin.id, tokenVersion: superAdmin.tokenVersion },
      {
        secret: this.config.getOrThrow<string>("SUPERADMIN_JWT_REFRESH_SECRET"),
        expiresIn: REFRESH_TOKEN_TTL,
      },
    );
  }
}
