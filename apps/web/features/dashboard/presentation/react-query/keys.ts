export const dashboardQueryKeys = {
  all: ["dashboard"] as const,
  business: (period: { endDate: string | null; startDate: string | null }) =>
    ["dashboard", "business", period] as const,
};
