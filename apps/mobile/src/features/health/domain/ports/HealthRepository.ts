import { SystemHealth } from "@/features/health/domain/entities/SystemHealth";

export interface HealthRepository {
  getCurrentStatus(): Promise<SystemHealth>;
}
