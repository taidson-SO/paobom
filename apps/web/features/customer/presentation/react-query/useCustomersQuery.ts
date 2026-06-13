"use client";

import { ListCustomersUseCase } from "@paobom/domain";
import { useQuery } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";

import { customerQueryKeys } from "./keys";

export function useCustomersQuery() {
  const useCase = container.get<ListCustomersUseCase>(
    TOKENS.listCustomersUseCase,
  );

  return useQuery({
    queryFn: () => useCase.execute(),
    queryKey: customerQueryKeys.all,
  });
}
