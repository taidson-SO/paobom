export const healthQueryKeys = {
  all: ["health"] as const,
  current: () => [...healthQueryKeys.all, "current"] as const,
};
