import { ApiClient } from "@/core/infrastructure/api/api-client";
import {
  AuthRepository,
  MobileSession,
} from "@/features/auth/domain/auth";

type LoginDTO = {
  expiresAt: string;
  token: string;
  user: MobileSession["user"];
};

export class ApiAuthRepository implements AuthRepository {
  constructor(private readonly apiClient: ApiClient) {}

  async login(email: string, password: string) {
    const response = await this.apiClient.post<LoginDTO>(
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

    return session;
  }

  async logout() {
    try {
      await this.apiClient.post("/auth/logout", {});
    } finally {
      this.apiClient.setToken(null);
    }
  }
}
