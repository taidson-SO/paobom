"use client";

import {
  CreateProductionOrderInput,
  CreateProductionOrderUseCase,
  CreateRecipeInput,
  CreateRecipeUseCase,
  CancelProductionOrderUseCase,
  FinishProductionOrderUseCase,
  StartProductionOrderUseCase,
} from "@paobom/domain";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";

import { productionQueryKeys } from "./keys";

export function useProductionMutations() {
  const queryClient = useQueryClient();
  const createRecipeUseCase = container.get<CreateRecipeUseCase>(
    TOKENS.createRecipeUseCase,
  );
  const createOrderUseCase = container.get<CreateProductionOrderUseCase>(
    TOKENS.createProductionOrderUseCase,
  );
  const startOrderUseCase = container.get<StartProductionOrderUseCase>(
    TOKENS.startProductionOrderUseCase,
  );
  const finishOrderUseCase = container.get<FinishProductionOrderUseCase>(
    TOKENS.finishProductionOrderUseCase,
  );
  const cancelOrderUseCase = container.get<CancelProductionOrderUseCase>(
    TOKENS.cancelProductionOrderUseCase,
  );
  const invalidateOrdersAndInventory = () => {
    void queryClient.invalidateQueries({
      queryKey: productionQueryKeys.orders,
    });
    void queryClient.invalidateQueries({
      queryKey: ["inventory"],
    });
  };

  return {
    cancelProductionOrder: useMutation({
      mutationFn: (id: string) => cancelOrderUseCase.execute(id),
      onSuccess: invalidateOrdersAndInventory,
    }),
    createProductionOrder: useMutation({
      mutationFn: (input: CreateProductionOrderInput) =>
        createOrderUseCase.execute(input),
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: productionQueryKeys.orders,
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
    finishProductionOrder: useMutation({
      mutationFn: (id: string) => finishOrderUseCase.execute(id),
      onSuccess: invalidateOrdersAndInventory,
    }),
    startProductionOrder: useMutation({
      mutationFn: (id: string) => startOrderUseCase.execute(id),
      onSuccess: invalidateOrdersAndInventory,
    }),
  };
}
