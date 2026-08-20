// Cliente HTTP tipado hacia apps/api, consumido por apps/web y apps/mobile.
import type {
  Appointment,
  AppointmentsRange,
  AssignableStaff,
  AuthResult,
  AuthTokens,
  CashClosing,
  CashClosingDetail,
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
  PublicUser,
  Sale,
  SalesRange,
  Service,
  Settings,
  UpdateAppointmentInput,
  UpdateCustomerInput,
  UpdateEmployeeInput,
  UpdateProductInput,
  UpdateServiceInput,
  UpdateSettingsInput,
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

  const res = await fetch(`${config.baseUrl}/auth/refresh`, {
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
      list: (range?: SalesRange) =>
        call<Sale[]>(`/sales${range ? `?range=${range}` : ""}`),
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
    appointments: {
      list: (params?: { date?: string; range?: AppointmentsRange }) => {
        const query = new URLSearchParams();
        if (params?.date) query.set("date", params.date);
        if (params?.range) query.set("range", params.range);
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

export type ApiClient = ReturnType<typeof createApiClient>;
export type {
  Appointment,
  AppointmentsRange,
  AssignableStaff,
  AuthResult,
  AuthTokens,
  CashClosing,
  CashClosingDetail,
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
  PublicUser,
  Sale,
  SalesRange,
  Service,
  Settings,
  UpdateAppointmentInput,
  UpdateCustomerInput,
  UpdateEmployeeInput,
  UpdateProductInput,
  UpdateServiceInput,
  UpdateSettingsInput,
};
