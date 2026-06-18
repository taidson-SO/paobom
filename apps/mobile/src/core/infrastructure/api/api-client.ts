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
  private unauthorizedHandler: (() => void) | null = null;

  constructor(private readonly baseUrl: string) {}

  setToken(token: string | null) {
    this.token = token;
  }

  setUnauthorizedHandler(handler: (() => void) | null) {
    this.unauthorizedHandler = handler;
  }

  reportClientError(error: unknown) {
    const normalized = normalizeError(error);

    return this.post(
      "/observability/client-errors",
      {
        ...normalized,
        source: "mobile",
      },
    );
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
      if (response.status === 401 && options.auth !== false) {
        this.token = null;
        this.unauthorizedHandler?.();
      }

      throw new Error(
        payload.error?.message ?? `Falha na requisicao (${response.status})`,
      );
    }

    return payload.data as TResponse;
  }
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  return {
    message: typeof error === "string" ? error : "Erro nao identificado",
    name: "UnknownError",
  };
}
