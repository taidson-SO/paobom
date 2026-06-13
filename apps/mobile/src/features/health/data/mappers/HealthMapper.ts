import { HealthStatusDTO } from "@/features/health/data/dto/HealthStatusDTO";
import { SystemHealth } from "@/features/health/domain/entities/SystemHealth";

export class HealthMapper {
  static toEntity(dto: HealthStatusDTO) {
    return new SystemHealth(dto.status, new Date(dto.checked_at));
  }
}
