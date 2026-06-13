export type HealthStatusDTO = {
  checked_at: string;
  status: "operational" | "degraded" | "offline";
};
