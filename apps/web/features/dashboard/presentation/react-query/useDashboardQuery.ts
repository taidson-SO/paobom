"use client";

import {
  DashboardPeriodInput,
  GetBusinessDashboardUseCase,
} from "@paobom/domain";
import { useQuery } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";

import { dashboardQueryKeys } from "./keys";

export function useDashboardQuery(period: DashboardPeriodInput = {}) {
  const useCase = container.get<GetBusinessDashboardUseCase>(
    TOKENS.getBusinessDashboardUseCase,
  );
  const periodKey = {
    endDate: period.endDate?.toISOString() ?? null,
    startDate: period.startDate?.toISOString() ?? null,
  };

  return useQuery({
    queryFn: () => useCase.execute(period),
    queryKey: dashboardQueryKeys.business(periodKey),
  });
}
