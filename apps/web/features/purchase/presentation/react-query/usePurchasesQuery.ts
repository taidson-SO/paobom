"use client";

import { ListPurchasesUseCase } from "@paobom/domain";
import { useQuery } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";

import { purchaseQueryKeys } from "./keys";

export function usePurchasesQuery() {
  const useCase = container.get<ListPurchasesUseCase>(
    TOKENS.listPurchasesUseCase,
  );

  return useQuery({
    queryFn: () => useCase.execute(),
    queryKey: purchaseQueryKeys.all,
  });
}
