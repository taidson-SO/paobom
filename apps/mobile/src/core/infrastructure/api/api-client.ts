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

export class ApiClient {
  private token: string | null = null;

  constructor(private readonly baseUrl: string) {}

  setToken(token: string | null) {
    this.token = token;
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

  private async request<TResponse>(
    path: string,
    options: ApiRequestOptions,
  ): Promise<TResponse> {
    const headers = new Headers(options.headers);

    headers.set("Content-Type", "application/json");

    if (options.auth !== false) {
      if (!this.token) {
        throw new Error("Sessao nao autenticada");
      }

      headers.set("Authorization", `Bearer ${this.token}`);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
      headers,
    });
    const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<TResponse>;

    if (!response.ok) {
      if (response.status === 401) {
        this.token = null;
      }

      throw new Error(
        payload.error?.message ?? `Falha na requisicao (${response.status})`,
      );
    }

    return payload.data as TResponse;
  }
}
