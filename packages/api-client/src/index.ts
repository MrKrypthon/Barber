// Cliente HTTP tipado hacia apps/api, consumido por apps/web y apps/mobile.
import type {
  AuthResult,
  AuthTokens,
  Customer,
  CreateCustomerInput,
  PublicUser,
  UpdateCustomerInput,
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
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
export type { AuthResult, AuthTokens, Customer, CreateCustomerInput, PublicUser, UpdateCustomerInput };
