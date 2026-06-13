import { HealthStatusDTO } from "@/features/health/data/dto/HealthStatusDTO";
import { HealthMapper } from "@/features/health/data/mappers/HealthMapper";
import { HealthRepository } from "@/features/health/domain/ports/HealthRepository";

export class MockHealthRepository implements HealthRepository {
  async getCurrentStatus() {
    const dto: HealthStatusDTO = {
      checked_at: new Date().toISOString(),
      status: "operational",
    };

    return HealthMapper.toEntity(dto);
  }
}
