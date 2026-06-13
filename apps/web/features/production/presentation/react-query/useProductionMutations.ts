"use client";

import {
  CreateProductionOrderInput,
  CreateProductionOrderUseCase,
  CreateRecipeInput,
  CreateRecipeUseCase,
} from "@paobom/domain";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";
import { inventoryQueryKeys } from "@/features/inventory/presentation/react-query/keys";

import { productionQueryKeys } from "./keys";

export function useProductionMutations() {
  const queryClient = useQueryClient();
  const createRecipeUseCase = container.get<CreateRecipeUseCase>(
    TOKENS.createRecipeUseCase,
  );
  const createOrderUseCase = container.get<CreateProductionOrderUseCase>(
    TOKENS.createProductionOrderUseCase,
  );

  return {
    createProductionOrder: useMutation({
      mutationFn: (input: CreateProductionOrderInput) =>
        createOrderUseCase.execute(input),
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: productionQueryKeys.orders,
        });
        void queryClient.invalidateQueries({
          queryKey: inventoryQueryKeys.balances,
        });
        void queryClient.invalidateQueries({
          queryKey: inventoryQueryKeys.movements,
        });
      },
    }),
    createRecipe: useMutation({
      mutationFn: (input: CreateRecipeInput) => createRecipeUseCase.execute(input),
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: productionQueryKeys.recipes,
        });
      },
    }),
  };
}
