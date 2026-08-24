import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersService } from "../../users/users.service";
import { AccessTokenPayload, AuthenticatedUser } from "../types/jwt-payload.type";

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("JWT_SECRET"),
      // Fija el algoritmo esperado en vez de confiar en el `alg` del header
      // del token (que en jsonwebtoken es quien lo elige si no se restringe
      // acá) — mitigación defense-in-depth de "algorithm confusion" para
      // cuando en el futuro conviva más de un algoritmo en el proyecto.
      algorithms: ["HS256"],
    });
  }

  // Compara contra el token_version guardado en BD, no solo la firma/expiración
  // del JWT. Así logout() y la rotación de refresh() revocan también los
  // access tokens ya emitidos, en vez de dejarlos válidos hasta su expiración
  // natural (15 min).
  async validate(payload: AccessTokenPayload): Promise<AuthenticatedUser> {
    const user = await this.usersService.findById(payload.sub);

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException("Sesión inválida o revocada");
    }

    return { userId: user.id, tenantId: user.tenantId, role: user.role };
  }
}
