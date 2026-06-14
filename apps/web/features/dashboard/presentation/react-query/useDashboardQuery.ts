"use client";

import { GetBusinessDashboardUseCase } from "@paobom/domain";
import { useQuery } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";

import { dashboardQueryKeys } from "./keys";

export function useDashboardQuery() {
  const useCase = container.get<GetBusinessDashboardUseCase>(
    TOKENS.getBusinessDashboardUseCase,
  );

  return useQuery({
    queryFn: () => useCase.execute(),
    queryKey: dashboardQueryKeys.business,
  });
}
