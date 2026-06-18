import { appConfig } from "@/core/config/app-config";
import { ApiClient } from "@/core/infrastructure/api/api-client";
import { eventBus } from "@/core/infrastructure/events/event-bus";
import { SecureKeyValueStorage } from "@/core/infrastructure/storage/storage";

import { container } from "./container";
import { TOKENS } from "./tokens";

let bootstrapped = false;

export function bootstrapCoreContainer() {
  if (bootstrapped) {
    return;
  }

  const apiClient = new ApiClient(appConfig.apiBaseUrl);

  container.register(TOKENS.apiClient, () => apiClient);
  container.register(TOKENS.eventBus, () => eventBus);
  const storage = new SecureKeyValueStorage();

  container.register(TOKENS.storage, () => storage);

  bootstrapped = true;
}
