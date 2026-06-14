"use client";

import { ListSalesUseCase } from "@paobom/domain";
import { useQuery } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";

import { salesQueryKeys } from "./keys";

export function useSalesQuery() {
  const useCase = container.get<ListSalesUseCase>(TOKENS.listSalesUseCase);

  return useQuery({
    queryFn: () => useCase.execute(),
    queryKey: salesQueryKeys.list,
  });
}
