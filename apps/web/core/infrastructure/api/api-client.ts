export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  auth?: boolean;
  body?: unknown;
};

type ApiEnvelope<TResponse> = {
  data?: TResponse;
  error?: {
    message: string;
    statusCode: number;
  };
};

export type ApiAuthenticatedUser = {
  email: string;
  id: string;
  name: string;
  permissions: string[];
  role: string;
};

export type ApiLoginResponse = {
  expiresAt: string;
  token: string;
  user: ApiAuthenticatedUser;
};

export class ApiClient {
  private unauthorizedHandler: (() => void) | null = null;

  constructor(private readonly baseUrl: string) {}

  setUnauthorizedHandler(handler: (() => void) | null) {
    this.unauthorizedHandler = handler;
  }

  login(email: string, password: string) {
    return this.post<ApiLoginResponse>(
      "/auth/login",
      { email, password },
      { auth: false },
    );
  }

  me() {
    return this.get<ApiAuthenticatedUser>("/auth/me");
  }

  logout() {
    return this.post("/auth/logout", {});
  }

  async get<TResponse>(path: string, options?: ApiRequestOptions) {
    return this.request<TResponse>(path, {
      ...options,
      method: "GET",
    });
  }

  async post<TResponse>(
    path: string,
    body: unknown,
    options?: ApiRequestOptions,
  ) {
    return this.request<TResponse>(path, {
      ...options,
      method: "POST",
      body,
    });
  }

  async patch<TResponse>(
    path: string,
    body: unknown,
    options?: ApiRequestOptions,
  ) {
    return this.request<TResponse>(path, {
      ...options,
      method: "PATCH",
      body,
    });
  }

  async delete<TResponse>(path: string, options?: ApiRequestOptions) {
    return this.request<TResponse>(path, {
      ...options,
      method: "DELETE",
    });
  }

  private async request<TResponse>(
    path: string,
    options: ApiRequestOptions,
  ): Promise<TResponse> {
    const headers = new Headers(options.headers);

    headers.set("Content-Type", "application/json");

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
      credentials: "include",
      headers,
    });
    const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<TResponse>;

    if (!response.ok) {
      if (response.status === 401 && options.auth !== false) {
        this.unauthorizedHandler?.();
      }

      throw new Error(
        payload.error?.message ?? `Falha na requisicao (${response.status})`,
      );
    }

    return payload.data as TResponse;
  }
}
