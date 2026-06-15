"use client";

import {
  ListInventoryBalancesUseCase,
  ListInventoryLotsUseCase,
  ListPhysicalInventoryCountsUseCase,
  ListStockMovementsUseCase,
} from "@paobom/domain";
import { useQuery } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";

import { inventoryQueryKeys } from "./keys";

export function useInventoryBalancesQuery() {
  const useCase = container.get<ListInventoryBalancesUseCase>(
    TOKENS.listInventoryBalancesUseCase,
  );

  return useQuery({
    queryFn: () => useCase.execute(),
    queryKey: inventoryQueryKeys.balances,
  });
}

export function useStockMovementsQuery() {
  const useCase = container.get<ListStockMovementsUseCase>(
    TOKENS.listStockMovementsUseCase,
  );

  return useQuery({
    queryFn: () => useCase.execute(),
    queryKey: inventoryQueryKeys.movements,
  });
}

export function useInventoryLotsQuery() {
  const useCase = container.get<ListInventoryLotsUseCase>(
    TOKENS.listInventoryLotsUseCase,
  );

  return useQuery({
    queryFn: () => useCase.execute(),
    queryKey: inventoryQueryKeys.lots,
  });
}

export function usePhysicalInventoryCountsQuery() {
  const useCase = container.get<ListPhysicalInventoryCountsUseCase>(
    TOKENS.listPhysicalInventoryCountsUseCase,
  );

  return useQuery({
    queryFn: () => useCase.execute(),
    queryKey: inventoryQueryKeys.counts,
  });
}
