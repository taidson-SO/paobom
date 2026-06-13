import { appConfig } from "@/core/config/app-config";
import { ApiClient } from "@/core/infrastructure/api/api-client";
import { eventBus } from "@/core/infrastructure/events/event-bus";
import { MemoryStorage } from "@/core/infrastructure/storage/storage";
import { MockHealthRepository } from "@/features/health/data/repositories/MockHealthRepository";
import { GetSystemHealthUseCase } from "@/features/health/domain/usecases/GetSystemHealthUseCase";

import { container } from "./container";
import { TOKENS } from "./tokens";

let bootstrapped = false;

export function bootstrapContainer() {
  if (bootstrapped) {
    return;
  }

  container.register(TOKENS.apiClient, () => new ApiClient(appConfig.apiBaseUrl));
  container.register(TOKENS.eventBus, () => eventBus);
  container.register(TOKENS.storage, () => new MemoryStorage());
  container.register(TOKENS.healthRepository, () => new MockHealthRepository());
  container.register(
    TOKENS.getSystemHealthUseCase,
    () =>
      new GetSystemHealthUseCase(
        container.get(TOKENS.healthRepository),
        container.get(TOKENS.eventBus),
      ),
  );

  bootstrapped = true;
}
