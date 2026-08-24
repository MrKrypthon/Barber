import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthenticatedSuperAdmin } from "../types/superadmin-jwt-payload.type";

export const CurrentSuperAdmin = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthenticatedSuperAdmin => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthenticatedSuperAdmin }>();
    return request.user;
  },
);
