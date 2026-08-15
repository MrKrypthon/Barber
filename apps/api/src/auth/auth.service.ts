import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Role, User } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { TenantsService } from "../tenants/tenants.service";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { RegisterDto } from "./dto/register.dto";
import { RefreshTokenPayload } from "./types/jwt-payload.type";
import { hashPassword, SALT_ROUNDS } from "./password.util";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "30d";

// Hash de una contraseña que nunca se usa para autenticar a nadie. Se compara
// contra ella cuando el email no existe, para que login() tarde lo mismo con
// email inválido que con contraseña incorrecta y no se pueda enumerar cuentas
// por tiempo de respuesta.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("timing-attack-mitigation", SALT_ROUNDS);

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string;
};

export type AuthResult = AuthTokens & { user: PublicUser };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantsService: TenantsService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    if (await this.usersService.emailIsTaken(dto.email)) {
      throw new ConflictException("Ya existe una cuenta con este correo");
    }

    const passwordHash = await hashPassword(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const tenant = await this.tenantsService.create(dto.businessName, tx);
      return this.usersService.create(
        {
          tenantId: tenant.id,
          name: dto.ownerName,
          email: dto.email,
          passwordHash,
          role: Role.owner,
        },
        tx,
      );
    });

    return this.buildAuthResult(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(dto.email);

    // Siempre se ejecuta un bcrypt.compare, exista o no el usuario, para que
    // el tiempo de respuesta no revele si un email está registrado.
    const passwordMatches = await bcrypt.compare(
      dto.password,
      user?.password ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !passwordMatches) {
      throw new UnauthorizedException("Credenciales inválidas");
    }

    return this.buildAuthResult(user);
  }

  async refresh(dto: RefreshDto): Promise<AuthTokens> {
    let payload: RefreshTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(dto.refreshToken, {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Refresh token inválido");
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException("Refresh token inválido");
    }

    // Rotación: cada refresh invalida el refresh token que se acaba de usar,
    // emitiendo uno nuevo con tokenVersion incrementado. Si un refresh token
    // robado se reutiliza después de que el legítimo ya rotó, este chequeo de
    // tokenVersion lo rechaza.
    const rotated = await this.usersService.incrementTokenVersion(user.id);

    return {
      accessToken: this.signAccessToken(rotated),
      refreshToken: this.signRefreshToken(rotated),
    };
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.incrementTokenVersion(userId);
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.toPublicUser(user);
  }

  private buildAuthResult(user: User): AuthResult {
    return {
      accessToken: this.signAccessToken(user),
      refreshToken: this.signRefreshToken(user),
      user: this.toPublicUser(user),
    };
  }

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };
  }

  private signAccessToken(user: User): string {
    return this.jwtService.sign(
      { sub: user.id, tenantId: user.tenantId, role: user.role, tokenVersion: user.tokenVersion },
      { secret: this.config.getOrThrow<string>("JWT_SECRET"), expiresIn: ACCESS_TOKEN_TTL },
    );
  }

  private signRefreshToken(user: User): string {
    return this.jwtService.sign(
      { sub: user.id, tenantId: user.tenantId, tokenVersion: user.tokenVersion },
      {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
        expiresIn: REFRESH_TOKEN_TTL,
      },
    );
  }
}
