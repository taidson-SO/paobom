"use client";

import { GetBusinessReportsUseCase } from "@paobom/domain";
import { useQuery } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";

import { reportsQueryKeys } from "./keys";

export function useReportsQuery() {
  const useCase = container.get<GetBusinessReportsUseCase>(
    TOKENS.getBusinessReportsUseCase,
  );

  return useQuery({
    queryFn: () => useCase.execute(),
    queryKey: reportsQueryKeys.business,
  });
}
