export type SuperAdminAccessTokenPayload = {
  sub: string;
  tokenVersion: number;
};

export type SuperAdminRefreshTokenPayload = {
  sub: string;
  tokenVersion: number;
};

export type AuthenticatedSuperAdmin = {
  superAdminId: string;
};
