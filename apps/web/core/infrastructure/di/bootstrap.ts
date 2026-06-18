import { appConfig } from "@/core/config/app-config";
import { ApiClient } from "@/core/infrastructure/api/api-client";
import { eventBus } from "@/core/infrastructure/events/event-bus";
import { MemoryStorage } from "@/core/infrastructure/storage/storage";

import { container } from "./container";
import { TOKENS } from "./tokens";

let bootstrapped = false;
let apiClient: ApiClient | null = null;

export function bootstrapCoreContainer() {
  if (bootstrapped) {
    return;
  }

  container.register(
    TOKENS.apiClient,
    () => {
      apiClient ??= new ApiClient(appConfig.apiBaseUrl);

      return apiClient;
    },
  );
  container.register(TOKENS.eventBus, () => eventBus);
  container.register(TOKENS.storage, () => new MemoryStorage());

  bootstrapped = true;
}
