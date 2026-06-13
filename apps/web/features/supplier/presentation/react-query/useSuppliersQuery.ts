"use client";

import { ListSuppliersUseCase } from "@paobom/domain";
import { useQuery } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";

import { supplierQueryKeys } from "./keys";

export function useSuppliersQuery() {
  const useCase = container.get<ListSuppliersUseCase>(
    TOKENS.listSuppliersUseCase,
  );

  return useQuery({
    queryFn: () => useCase.execute(),
    queryKey: supplierQueryKeys.all,
  });
}
