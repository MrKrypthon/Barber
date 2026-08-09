import { Role } from "@prisma/client";

export type AccessTokenPayload = {
  sub: string;
  tenantId: string;
  role: Role;
};

export type RefreshTokenPayload = {
  sub: string;
  tenantId: string;
  tokenVersion: number;
};

export type AuthenticatedUser = {
  userId: string;
  tenantId: string;
  role: Role;
};
