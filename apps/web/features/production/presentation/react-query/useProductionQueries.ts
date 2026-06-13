"use client";

import { ListProductionOrdersUseCase, ListRecipesUseCase } from "@paobom/domain";
import { useQuery } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";

import { productionQueryKeys } from "./keys";

export function useRecipesQuery() {
  const useCase = container.get<ListRecipesUseCase>(TOKENS.listRecipesUseCase);

  return useQuery({
    queryFn: () => useCase.execute(),
    queryKey: productionQueryKeys.recipes,
  });
}

export function useProductionOrdersQuery() {
  const useCase = container.get<ListProductionOrdersUseCase>(
    TOKENS.listProductionOrdersUseCase,
  );

  return useQuery({
    queryFn: () => useCase.execute(),
    queryKey: productionQueryKeys.orders,
  });
}
