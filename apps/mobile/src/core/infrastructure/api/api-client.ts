export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export class ApiClient {
  constructor(private readonly baseUrl: string) {}

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
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return response.json() as Promise<TResponse>;
  }
}
