export type SystemHealthStatus = "operational" | "degraded" | "offline";

export class SystemHealth {
  constructor(
    public readonly status: SystemHealthStatus,
    public readonly checkedAt: Date,
  ) {}

  isOperational() {
    return this.status === "operational";
  }
}
