"use client";

import {
  GetCustomerRelationshipSummaryUseCase,
  ListCustomerInteractionsUseCase,
} from "@paobom/domain";
import { useQuery } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";

import { customerRelationshipQueryKeys } from "./keys";

export function useCustomerInteractionsQuery() {
  const useCase = container.get<ListCustomerInteractionsUseCase>(
    TOKENS.listCustomerInteractionsUseCase,
  );

  return useQuery({
    queryFn: () => useCase.execute(),
    queryKey: customerRelationshipQueryKeys.interactions,
  });
}

export function useCustomerRelationshipSummaryQuery() {
  const useCase = container.get<GetCustomerRelationshipSummaryUseCase>(
    TOKENS.getCustomerRelationshipSummaryUseCase,
  );

  return useQuery({
    queryFn: () => useCase.execute(),
    queryKey: customerRelationshipQueryKeys.summary,
  });
}
