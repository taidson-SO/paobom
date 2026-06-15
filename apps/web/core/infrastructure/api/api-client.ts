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

type ApiAuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  permissions: string[];
  role: string;
};

type ApiLoginResponse = {
  expiresAt: string;
  token: string;
  user: ApiAuthenticatedUser;
};

export class ApiClient {
  private token: string | null = null;

  constructor(
    private readonly baseUrl: string,
    private readonly defaultCredentials?: {
      email: string;
      password: string;
    },
  ) {}

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
    const shouldAuthenticate = options.auth ?? !path.startsWith("/auth/login");
    const headers = new Headers(options.headers);

    headers.set("Content-Type", "application/json");

    if (shouldAuthenticate) {
      const token = await this.getToken();

      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
      headers,
    });
    const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<TResponse>;

    if (!response.ok) {
      throw new Error(
        payload.error?.message ?? `Request failed with status ${response.status}`,
      );
    }

    return payload.data as TResponse;
  }

  private async getToken() {
    if (this.token) {
      return this.token;
    }

    if (!this.defaultCredentials) {
      throw new Error("Credenciais padrao da API nao configuradas");
    }

    const session = await this.request<ApiLoginResponse>("/auth/login", {
      auth: false,
      body: this.defaultCredentials,
      method: "POST",
    });

    this.token = session.token;

    return this.token;
  }
}
