"use client";

import {
  GetCashFlowSummaryUseCase,
  GetCurrentCashRegisterUseCase,
  ListCashEntriesUseCase,
  ListCashRegistersUseCase,
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

export function useCurrentCashRegisterQuery() {
  const useCase = container.get<GetCurrentCashRegisterUseCase>(
    TOKENS.getCurrentCashRegisterUseCase,
  );

  return useQuery({
    queryFn: () => useCase.execute(),
    queryKey: financeQueryKeys.currentCashRegister,
  });
}

export function useCashRegistersQuery() {
  const useCase = container.get<ListCashRegistersUseCase>(
    TOKENS.listCashRegistersUseCase,
  );

  return useQuery({
    queryFn: () => useCase.execute(),
    queryKey: financeQueryKeys.cashRegisters,
  });
}
