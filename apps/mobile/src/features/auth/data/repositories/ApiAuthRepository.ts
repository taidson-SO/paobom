import { ApiClient } from "@/core/infrastructure/api/api-client";
import { KeyValueStorage } from "@/core/infrastructure/storage/storage";
import {
  AuthRepository,
  MobileSession,
} from "@/features/auth/domain/auth";

type StoredSession = {
  expiresAt: string;
  token: string;
  user: MobileSession["user"];
};

const sessionStorageKey = "paobom.mobile.session";

export class ApiAuthRepository implements AuthRepository {
  constructor(
    private readonly apiClient: ApiClient,
    private readonly storage: KeyValueStorage,
  ) {}

  async login(email: string, password: string) {
    const response = await this.apiClient.post<StoredSession>(
      "/auth/login",
      { email, password },
      { auth: false },
    );
    const session: MobileSession = {
      expiresAt: new Date(response.expiresAt),
      token: response.token,
      user: response.user,
    };

    this.apiClient.setToken(session.token);
    await this.persist(session);

    return session;
  }

  async restoreSession() {
    const stored = await this.storage.getItem(sessionStorageKey);

    if (!stored) {
      return null;
    }

    try {
      const parsed = JSON.parse(stored) as StoredSession;
      const expiresAt = new Date(parsed.expiresAt);

      if (!parsed.token || expiresAt <= new Date()) {
        await this.clearLocalSession();
        return null;
      }

      this.apiClient.setToken(parsed.token);
      const user = await this.apiClient.get<MobileSession["user"]>("/auth/me");
      const session = { expiresAt, token: parsed.token, user };

      await this.persist(session);

      return session;
    } catch {
      await this.clearLocalSession();
      return null;
    }
  }

  async logout() {
    try {
      await this.apiClient.post("/auth/logout", {});
    } finally {
      await this.clearLocalSession();
    }
  }

  async clearLocalSession() {
    this.apiClient.setToken(null);
    await this.storage.removeItem(sessionStorageKey);
  }

  private persist(session: MobileSession) {
    return this.storage.setItem(
      sessionStorageKey,
      JSON.stringify({
        ...session,
        expiresAt: session.expiresAt.toISOString(),
      }),
    );
  }
}
