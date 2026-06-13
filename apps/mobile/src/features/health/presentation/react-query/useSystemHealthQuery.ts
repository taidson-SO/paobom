import { useQuery } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";
import { GetSystemHealthUseCase } from "@/features/health/domain/usecases/GetSystemHealthUseCase";

import { healthQueryKeys } from "./keys";

export function useSystemHealthQuery() {
  const useCase = container.get<GetSystemHealthUseCase>(
    TOKENS.getSystemHealthUseCase,
  );

  return useQuery({
    queryFn: () => useCase.execute(),
    queryKey: healthQueryKeys.current(),
  });
}
