export const TOKENS = {
  apiClient: Symbol("apiClient"),
  eventBus: Symbol("eventBus"),
  getSystemHealthUseCase: Symbol("getSystemHealthUseCase"),
  healthRepository: Symbol("healthRepository"),
  storage: Symbol("storage"),
} as const;
