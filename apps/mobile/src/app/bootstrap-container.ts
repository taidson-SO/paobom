import { bootstrapCoreContainer } from "@/core/infrastructure/di/bootstrap";
import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";
import { MockHealthRepository } from "@/features/health/data/repositories/MockHealthRepository";
import { GetSystemHealthUseCase } from "@/features/health/domain/usecases/GetSystemHealthUseCase";

let bootstrapped = false;

export function bootstrapAppContainer() {
  if (bootstrapped) {
    return;
  }

  bootstrapCoreContainer();

  container.register(TOKENS.healthRepository, () => new MockHealthRepository());
  container.register(
    TOKENS.getSystemHealthUseCase,
    () =>
      new GetSystemHealthUseCase(
        container.get(TOKENS.healthRepository),
        container.get(TOKENS.eventBus),
      ),
  );

  bootstrapped = true;
}
