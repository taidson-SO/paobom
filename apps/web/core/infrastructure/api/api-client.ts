export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  auth?: boolean;
  body?: unknown;
  retry?: boolean;
  timeoutMs?: number;
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

type ApiClientConfig = {
  retryDelayMs?: number;
  timeoutMs?: number;
};

const defaultRetryDelayMs = 300;
const defaultTimeoutMs = 15_000;
const retryableStatuses = new Set([408, 429, 500, 502, 503, 504]);

export class ApiClient {
  private unauthorizedHandler: (() => void) | null = null;
  private readonly retryDelayMs: number;
  private readonly timeoutMs: number;

  constructor(
    private readonly baseUrl: string,
    config: ApiClientConfig = {},
  ) {
    this.retryDelayMs = config.retryDelayMs ?? defaultRetryDelayMs;
    this.timeoutMs = config.timeoutMs ?? defaultTimeoutMs;
  }

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

  reportClientError(error: unknown) {
    const normalized = normalizeError(error);

    return this.post(
      "/observability/client-errors",
      {
        ...normalized,
        source: "web",
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
    const shouldRetry = options.retry ?? options.method === "GET";
    const maxAttempts = shouldRetry ? 2 : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await this.fetchWithTimeout(path, options);
        const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<TResponse>;

        if (!response.ok) {
          if (response.status === 401 && options.auth !== false) {
            this.unauthorizedHandler?.();
          }

          if (attempt < maxAttempts && retryableStatuses.has(response.status)) {
            await delay(this.retryDelayMs);
            continue;
          }

          throw new Error(
            payload.error?.message ?? `Falha na requisicao (${response.status})`,
          );
        }

        return payload.data as TResponse;
      } catch (error) {
        if (
          attempt < maxAttempts &&
          isTransientRequestError(error) &&
          !isAbortSignalTriggered(options.signal)
        ) {
          await delay(this.retryDelayMs);
          continue;
        }

        throw normalizeRequestError(error);
      }
    }

    throw new Error("Falha na requisicao");
  }

  private async fetchWithTimeout(path: string, options: ApiRequestOptions) {
    const headers = new Headers(options.headers);
    const timeoutMs = options.timeoutMs ?? this.timeoutMs;
    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);
    const removeAbortListener = forwardAbortSignal(options.signal, controller);

    headers.set("Content-Type", "application/json");

    try {
      return await fetch(`${this.baseUrl}${path}`, {
        ...options,
        body: options.body ? JSON.stringify(options.body) : undefined,
        credentials: "include",
        headers,
        signal: controller.signal,
      });
    } finally {
      globalThis.clearTimeout(timeout);
      removeAbortListener();
    }
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

function normalizeRequestError(error: unknown) {
  if (isAbortError(error)) {
    return new Error("Tempo excedido ao comunicar com a API");
  }

  return error;
}

function isTransientRequestError(error: unknown) {
  return error instanceof TypeError || isAbortError(error);
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function isAbortSignalTriggered(signal: AbortSignal | null | undefined) {
  return Boolean(signal?.aborted);
}

function forwardAbortSignal(
  signal: AbortSignal | null | undefined,
  controller: AbortController,
) {
  if (!signal) {
    return () => undefined;
  }

  if (signal.aborted) {
    controller.abort();
    return () => undefined;
  }

  const abort = () => controller.abort();
  signal.addEventListener("abort", abort, { once: true });

  return () => signal.removeEventListener("abort", abort);
}

function delay(milliseconds: number) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, milliseconds);
  });
}
