// Tipos compartidos entre apps/web, apps/api y apps/mobile.
// Se puebla incrementalmente conforme cada módulo se conecta de punta a punta.

export type Role = "owner" | "employee";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResult = AuthTokens & { user: PublicUser };

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCustomerInput = {
  name: string;
  phone?: string;
  notes?: string;
};

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

export type Service = {
  id: string;
  name: string;
  price: number;
  active: boolean;
  durationMinutes: number | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateServiceInput = {
  name: string;
  price: number;
  active?: boolean;
  durationMinutes?: number;
  color?: string;
};

export type UpdateServiceInput = Partial<CreateServiceInput>;
