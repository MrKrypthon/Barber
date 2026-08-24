// Cliente HTTP tipado hacia apps/api, consumido por apps/web y apps/mobile.
import type {
  Appointment,
  AppointmentsRange,
  AssignableStaff,
  AuthResult,
  AuthTokens,
  CashClosing,
  CashClosingDetail,
  CashReport,
  CashSummary,
  CreateAppointmentInput,
  CreateCashMovementInput,
  CreateCustomerInput,
  CreateEmployeeInput,
  CreateProductInput,
  CreateProductMovementInput,
  CreateSaleInput,
  CreateServiceInput,
  Customer,
  Employee,
  Product,
  ProductMovement,
  PublicSuperAdmin,
  PublicUser,
  RecordTenantPaymentInput,
  Sale,
  SalesRange,
  Service,
  Settings,
  SuperAdminAuthResult,
  TenantDetail,
  TenantPayment,
  TenantSummary,
  UpdateAppointmentInput,
  UpdateCustomerInput,
  UpdateEmployeeInput,
  UpdateProductInput,
  UpdateServiceInput,
  UpdateSettingsInput,
  UpdateWhatsAppConnectionInput,
  WhatsAppConnection,
} from "@barber/types";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiClientConfig = {
  baseUrl: string;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onTokensRefreshed: (tokens: AuthTokens) => void;
  onSessionExpired: () => void;
  // "/auth/refresh" por defecto — createSuperAdminApiClient lo pisa con
  // "/superadmin/auth/refresh", un endpoint completamente distinto.
  refreshPath?: string;
};

type RequestOptions = {
  skipAuth?: boolean;
  skipRefresh?: boolean;
};

async function toApiError(res: Response): Promise<ApiError> {
  const body = await res.json().catch(() => null);
  const message = Array.isArray(body?.message)
    ? body.message.join(", ")
    : (body?.message ?? res.statusText);
  return new ApiError(res.status, message);
}

// Cuando el access token expira (401) intenta refrescarlo una sola vez y
// reintenta la petición original; si el refresh también falla, cierra la
// sesión. skipRefresh evita el loop en /auth/login y en el propio /auth/refresh.
async function tryRefresh(config: ApiClientConfig): Promise<boolean> {
  const refreshToken = config.getRefreshToken();
  if (!refreshToken) return false;

  const res = await fetch(`${config.baseUrl}${config.refreshPath ?? "/auth/refresh"}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return false;

  config.onTokensRefreshed((await res.json()) as AuthTokens);
  return true;
}

async function request<T>(
  config: ApiClientConfig,
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {},
): Promise<T> {
  const token = options.skipAuth ? null : config.getAccessToken();
  const res = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401 && !options.skipRefresh) {
    if (await tryRefresh(config)) {
      return request<T>(config, path, init, { ...options, skipRefresh: true });
    }
    config.onSessionExpired();
  }

  if (!res.ok) {
    throw await toApiError(res);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function createApiClient(config: ApiClientConfig) {
  const call = <T>(path: string, init?: RequestInit, options?: RequestOptions) =>
    request<T>(config, path, init, options);

  return {
    auth: {
      register: (input: { businessName: string; ownerName: string; email: string; password: string }) =>
        call<AuthResult>(
          "/auth/register",
          { method: "POST", body: JSON.stringify(input) },
          { skipAuth: true, skipRefresh: true },
        ),
      login: (input: { email: string; password: string }) =>
        call<AuthResult>(
          "/auth/login",
          { method: "POST", body: JSON.stringify(input) },
          { skipAuth: true, skipRefresh: true },
        ),
      logout: () => call<{ success: boolean }>("/auth/logout", { method: "POST" }),
      me: () => call<PublicUser>("/auth/me"),
    },
    customers: {
      list: () => call<Customer[]>("/customers"),
      create: (input: CreateCustomerInput) =>
        call<Customer>("/customers", { method: "POST", body: JSON.stringify(input) }),
      update: (id: string, input: UpdateCustomerInput) =>
        call<Customer>(`/customers/${id}`, { method: "PUT", body: JSON.stringify(input) }),
      remove: (id: string) => call<{ success: boolean }>(`/customers/${id}`, { method: "DELETE" }),
    },
    employees: {
      list: () => call<Employee[]>("/employees"),
      assignable: () => call<AssignableStaff[]>("/employees/assignable"),
      create: (input: CreateEmployeeInput) =>
        call<Employee>("/employees", { method: "POST", body: JSON.stringify(input) }),
      update: (id: string, input: UpdateEmployeeInput) =>
        call<Employee>(`/employees/${id}`, { method: "PUT", body: JSON.stringify(input) }),
      remove: (id: string) => call<{ success: boolean }>(`/employees/${id}`, { method: "DELETE" }),
    },
    services: {
      list: () => call<Service[]>("/services"),
      create: (input: CreateServiceInput) =>
        call<Service>("/services", { method: "POST", body: JSON.stringify(input) }),
      update: (id: string, input: UpdateServiceInput) =>
        call<Service>(`/services/${id}`, { method: "PUT", body: JSON.stringify(input) }),
      remove: (id: string) => call<{ success: boolean }>(`/services/${id}`, { method: "DELETE" }),
    },
    sales: {
      // since: alternativa a range para pedir "desde esta fecha hasta
      // ahora" (ej. el Panel del administrador, que no encaja en ninguno
      // de los buckets fijos de SalesRange).
      list: (params?: { range?: SalesRange; since?: string }) => {
        const query = new URLSearchParams();
        if (params?.range) query.set("range", params.range);
        if (params?.since) query.set("since", params.since);
        const qs = query.toString();
        return call<Sale[]>(`/sales${qs ? `?${qs}` : ""}`);
      },
      create: (input: CreateSaleInput) =>
        call<Sale>("/sales", { method: "POST", body: JSON.stringify(input) }),
    },
    cash: {
      getSummary: (range?: SalesRange) =>
        call<CashSummary>(`/cash${range ? `?range=${range}` : ""}`),
      registerMovement: (input: CreateCashMovementInput) =>
        call<CashSummary["movements"][number]>("/cash/movement", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      close: () => call<CashClosing>("/cash/close", { method: "POST" }),
      listClosings: () => call<CashClosing[]>("/cash/closings"),
      getClosing: (date: string) => call<CashClosingDetail>(`/cash/closings/${date}`),
      getReport: (from: string, to: string) =>
        call<CashReport>(`/cash/report?from=${from}&to=${to}`),
    },
    products: {
      list: () => call<Product[]>("/products"),
      create: (input: CreateProductInput) =>
        call<Product>("/products", { method: "POST", body: JSON.stringify(input) }),
      update: (id: string, input: UpdateProductInput) =>
        call<Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify(input) }),
      remove: (id: string) => call<{ success: boolean }>(`/products/${id}`, { method: "DELETE" }),
      listMovements: (id: string) => call<ProductMovement[]>(`/products/${id}/movements`),
      registerMovement: (id: string, input: CreateProductMovementInput) =>
        call<ProductMovement>(`/products/${id}/movements`, {
          method: "POST",
          body: JSON.stringify(input),
        }),
    },
    settings: {
      get: () => call<Settings>("/settings"),
      update: (input: UpdateSettingsInput) =>
        call<Settings>("/settings", { method: "PUT", body: JSON.stringify(input) }),
    },
    whatsapp: {
      getConnection: () => call<WhatsAppConnection>("/whatsapp/connection"),
      upsertConnection: (input: UpdateWhatsAppConnectionInput) =>
        call<WhatsAppConnection>("/whatsapp/connection", {
          method: "PUT",
          body: JSON.stringify(input),
        }),
      removeConnection: () =>
        call<{ success: boolean }>("/whatsapp/connection", { method: "DELETE" }),
    },
    appointments: {
      list: (params?: { date?: string; range?: AppointmentsRange; since?: string }) => {
        const query = new URLSearchParams();
        if (params?.date) query.set("date", params.date);
        if (params?.range) query.set("range", params.range);
        if (params?.since) query.set("since", params.since);
        const qs = query.toString();
        return call<Appointment[]>(`/appointments${qs ? `?${qs}` : ""}`);
      },
      create: (input: CreateAppointmentInput) =>
        call<Appointment>("/appointments", { method: "POST", body: JSON.stringify(input) }),
      update: (id: string, input: UpdateAppointmentInput) =>
        call<Appointment>(`/appointments/${id}`, { method: "PUT", body: JSON.stringify(input) }),
      remove: (id: string) =>
        call<{ success: boolean }>(`/appointments/${id}`, { method: "DELETE" }),
    },
  };
}

// Cliente separado a propósito, no un namespace más dentro de
// createApiClient: usa endpoints, tokens y flujo de refresh completamente
// distintos (ver ApiClientConfig.refreshPath) de los de negocio. Cada app
// que lo use debe apuntarlo a su propio storage de tokens (nunca el mismo
// que usa createApiClient), para que una sesión de SuperAdmin y una de
// negocio nunca se pisen en el mismo navegador.
export function createSuperAdminApiClient(config: ApiClientConfig) {
  const call = <T>(path: string, init?: RequestInit, options?: RequestOptions) =>
    request<T>(config, path, init, options);

  return {
    auth: {
      login: (input: { email: string; password: string }) =>
        call<SuperAdminAuthResult>(
          "/superadmin/auth/login",
          { method: "POST", body: JSON.stringify(input) },
          { skipAuth: true, skipRefresh: true },
        ),
      logout: () => call<{ success: boolean }>("/superadmin/auth/logout", { method: "POST" }),
      me: () => call<PublicSuperAdmin>("/superadmin/auth/me"),
    },
    tenants: {
      list: () => call<TenantSummary[]>("/superadmin/tenants"),
      get: (id: string) => call<TenantDetail>(`/superadmin/tenants/${id}`),
      suspend: (id: string) =>
        call<TenantSummary>(`/superadmin/tenants/${id}/suspend`, { method: "POST" }),
      activate: (id: string) =>
        call<TenantSummary>(`/superadmin/tenants/${id}/activate`, { method: "POST" }),
      recordPayment: (id: string, input: RecordTenantPaymentInput) =>
        call<TenantDetail>(`/superadmin/tenants/${id}/payments`, {
          method: "POST",
          body: JSON.stringify(input),
        }),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
export type SuperAdminApiClient = ReturnType<typeof createSuperAdminApiClient>;
export type {
  Appointment,
  AppointmentsRange,
  AssignableStaff,
  AuthResult,
  AuthTokens,
  CashClosing,
  CashClosingDetail,
  CashReport,
  CashSummary,
  CreateAppointmentInput,
  CreateCashMovementInput,
  Customer,
  CreateCustomerInput,
  CreateEmployeeInput,
  CreateProductInput,
  CreateProductMovementInput,
  CreateSaleInput,
  CreateServiceInput,
  Employee,
  Product,
  ProductMovement,
  PublicSuperAdmin,
  PublicUser,
  RecordTenantPaymentInput,
  Sale,
  SalesRange,
  Service,
  Settings,
  SuperAdminAuthResult,
  TenantDetail,
  TenantPayment,
  TenantSummary,
  UpdateAppointmentInput,
  UpdateCustomerInput,
  UpdateEmployeeInput,
  UpdateProductInput,
  UpdateServiceInput,
  UpdateSettingsInput,
  UpdateWhatsAppConnectionInput,
  WhatsAppConnection,
};
