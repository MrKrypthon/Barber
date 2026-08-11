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

export type PaymentMethod = "cash" | "transfer";

export type SaleItem = {
  serviceId: string;
  serviceName: string;
  price: number;
};

export type Sale = {
  id: string;
  customer: { id: string; name: string } | null;
  employee: { id: string; name: string };
  paymentMethod: PaymentMethod;
  total: number;
  items: SaleItem[];
  createdAt: string;
};

export type CreateSaleInput = {
  customerId?: string;
  serviceIds: string[];
  paymentMethod: PaymentMethod;
};

export type SalesRange = "today" | "week" | "month";

export type CashMovementType = "income" | "expense";

export type CashMovement = {
  id: string;
  type: CashMovementType;
  amount: number;
  description: string | null;
  createdAt: string;
};

export type CashSummary = {
  range: SalesRange;
  income: number;
  expense: number;
  balance: number;
  movements: CashMovement[];
  closedAt: string | null;
};

export type CreateCashMovementInput = {
  type: CashMovementType;
  amount: number;
  description?: string;
};

export type CashClosing = {
  id: string;
  income: number;
  expense: number;
  balance: number;
  closedBy: { id: string; name: string };
  closedAt: string;
};

export type Settings = {
  businessName: string;
  logo: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  phone: string | null;
  address: string | null;
};

export type UpdateSettingsInput = Partial<{
  businessName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  phone: string;
  address: string;
}>;

export type AppointmentsRange = "today" | "week";

export type Appointment = {
  id: string;
  customer: { id: string; name: string };
  service: { id: string; name: string; color: string | null };
  employee: { id: string; name: string };
  startAt: string;
  durationMinutes: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateAppointmentInput = {
  customerId: string;
  serviceId: string;
  employeeId?: string;
  startAt: string;
};

export type UpdateAppointmentInput = Partial<CreateAppointmentInput>;
