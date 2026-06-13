"use client";

import { ListProductsUseCase } from "@paobom/domain";
import { useQuery } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";

import { productQueryKeys } from "./keys";

export function useProductsQuery() {
  const useCase = container.get<ListProductsUseCase>(
    TOKENS.listProductsUseCase,
  );

  return useQuery({
    queryFn: () => useCase.execute(),
    queryKey: productQueryKeys.all,
  });
}
