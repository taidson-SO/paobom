"use client";

import {
  GetCashFlowSummaryUseCase,
  ListCashEntriesUseCase,
} from "@paobom/domain";
import { useQuery } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";

import { financeQueryKeys } from "./keys";

export function useCashEntriesQuery() {
  const useCase = container.get<ListCashEntriesUseCase>(
    TOKENS.listCashEntriesUseCase,
  );

  return useQuery({
    queryFn: () => useCase.execute(),
    queryKey: financeQueryKeys.entries,
  });
}

export function useCashFlowSummaryQuery() {
  const useCase = container.get<GetCashFlowSummaryUseCase>(
    TOKENS.getCashFlowSummaryUseCase,
  );

  return useQuery({
    queryFn: () => useCase.execute(),
    queryKey: financeQueryKeys.summary,
  });
}
