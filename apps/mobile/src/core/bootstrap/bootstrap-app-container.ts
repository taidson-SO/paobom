import { ApiClient } from "@/core/infrastructure/api/api-client";
import { bootstrapCoreContainer } from "@/core/infrastructure/di/bootstrap";
import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";
import { ApiAuthRepository } from "@/features/auth/data/repositories/ApiAuthRepository";
import { ApiMobileOperationsRepository } from "@/features/operations/data/repositories/ApiMobileOperationsRepository";

let bootstrapped = false;

export function bootstrapAppContainer() {
  if (bootstrapped) {
    return;
  }

  bootstrapCoreContainer();
  const apiClient = container.get<ApiClient>(TOKENS.apiClient);

  const authRepository = new ApiAuthRepository(apiClient);
  const operationsRepository = new ApiMobileOperationsRepository(apiClient);

  container.register(TOKENS.authRepository, () => authRepository);
  container.register(
    TOKENS.mobileOperationsRepository,
    () => operationsRepository,
  );

  bootstrapped = true;
}
