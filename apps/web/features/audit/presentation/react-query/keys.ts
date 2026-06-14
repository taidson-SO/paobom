export const auditQueryKeys = {
  all: ["audit"] as const,
  logs: (filter: {
    action: string;
    endDate: string | null;
    entity: string;
    startDate: string | null;
    userId: string;
  }) => ["audit", "logs", filter] as const,
};
