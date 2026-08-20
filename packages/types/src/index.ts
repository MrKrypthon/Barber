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

export type Employee = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateEmployeeInput = {
  name: string;
  email: string;
  password: string;
};

// password es opcional: el dueño solo la manda cuando quiere resetearla.
export type UpdateEmployeeInput = Partial<CreateEmployeeInput>;

// Owner + empleados activos del tenant, para elegir "quién atendió esto" al
// agendar un turno o cobrar una venta. A diferencia de Employee, incluye al
// owner y no expone el email.
export type AssignableStaff = {
  id: string;
  name: string;
};

export type Service = {
  id: string;
  name: string;
  price: number;
  active: boolean;
  durationMinutes: number | null;
  color: string | null;
  // % (0-100) de comisión para quien realice este servicio. null = sin
  // comisión configurada.
  commissionPercent: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateServiceInput = {
  name: string;
  price: number;
  active?: boolean;
  durationMinutes?: number;
  color?: string;
  // null sirve para borrar una comisión ya puesta al editar (Partial abajo).
  commissionPercent?: number | null;
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
  // Si se omite, la venta queda a nombre de quien la registra. Asignarla a
  // otro empleado es exclusivo del owner (el backend lo valida).
  employeeId?: string;
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
  date: string;
  income: number;
  expense: number;
  balance: number;
  closedBy: { id: string; name: string };
  closedAt: string;
};

export type CashClosingDetail = CashClosing & {
  movements: CashMovement[];
};

export type CashReportDay = {
  date: string;
  income: number;
  expense: number;
  balance: number;
  movements: CashMovement[];
};

// Reporte por rango (semana/quincena/mes/personalizado): a diferencia de
// CashClosing, no depende de que cada día se haya cerrado — se calcula en
// vivo y siempre trae un CashReportDay por cada día del rango (en cero si
// no hubo actividad).
export type CashReport = {
  from: string;
  to: string;
  income: number;
  expense: number;
  balance: number;
  days: CashReportDay[];
};

export type Settings = {
  businessName: string;
  logo: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  backgroundColor: string | null;
  phone: string | null;
  address: string | null;
  scheduleDays: string[];
  scheduleOpen: string | null;
  scheduleClose: string | null;
};

export type UpdateSettingsInput = Partial<{
  businessName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  phone: string;
  address: string;
  scheduleDays: string[];
  scheduleOpen: string;
  scheduleClose: string;
}>;

export type ProductMovementType = "entry" | "exit";

export type Product = {
  id: string;
  name: string;
  // Data URI (base64), mismo criterio que Settings.logo. null = sin foto.
  photo: string | null;
  stock: number;
  // Debajo de este número se marca "stock bajo" en la UI. null = sin
  // configurar, nunca se marca.
  minStock: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductInput = {
  name: string;
  photo?: string;
  stock?: number;
  minStock?: number | null;
};

// El stock no forma parte de esto: solo se edita name/photo/minStock, el
// stock cambia únicamente vía CreateProductMovementInput. minStock: null
// borra un mínimo ya configurado (mismo criterio que
// UpdateServiceInput.commissionPercent).
export type UpdateProductInput = {
  name?: string;
  photo?: string;
  minStock?: number | null;
};

export type ProductMovement = {
  id: string;
  type: ProductMovementType;
  quantity: number;
  description: string | null;
  createdAt: string;
};

export type CreateProductMovementInput = {
  type: ProductMovementType;
  quantity: number;
  description?: string;
};

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
