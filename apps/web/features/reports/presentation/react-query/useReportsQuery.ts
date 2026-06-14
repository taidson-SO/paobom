"use client";

import { GetBusinessReportsUseCase, ReportsPeriodInput } from "@paobom/domain";
import { useQuery } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";

import { reportsQueryKeys } from "./keys";

export function useReportsQuery(period: ReportsPeriodInput = {}) {
  const useCase = container.get<GetBusinessReportsUseCase>(
    TOKENS.getBusinessReportsUseCase,
  );
  const periodKey = {
    endDate: period.endDate?.toISOString() ?? null,
    startDate: period.startDate?.toISOString() ?? null,
  };

  return useQuery({
    queryFn: () => useCase.execute(period),
    queryKey: reportsQueryKeys.business(periodKey),
  });
}
