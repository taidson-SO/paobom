import { AppEvents, EventBus } from "@/core/infrastructure/events/event-bus";
import { HealthRepository } from "@/features/health/domain/ports/HealthRepository";

export class GetSystemHealthUseCase {
  constructor(
    private readonly repository: HealthRepository,
    private readonly events: EventBus<AppEvents>,
  ) {}

  async execute() {
    const health = await this.repository.getCurrentStatus();

    this.events.emit("health:checked", {
      status: health.status,
    });

    return health;
  }
}
