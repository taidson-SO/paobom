export const reportsQueryKeys = {
  all: ["reports"] as const,
  business: (period: { endDate: string | null; startDate: string | null }) =>
    ["reports", "business", period] as const,
};
