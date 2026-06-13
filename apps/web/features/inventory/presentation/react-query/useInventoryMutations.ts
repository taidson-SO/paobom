"use client";

import {
  RegisterAdjustmentInput,
  RegisterInventoryAdjustmentUseCase,
  RegisterLossInput,
  RegisterLossUseCase,
} from "@paobom/domain";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";

import { inventoryQueryKeys } from "./keys";

export function useInventoryMutations() {
  const queryClient = useQueryClient();
  const registerLossUseCase = container.get<RegisterLossUseCase>(
    TOKENS.registerLossUseCase,
  );
  const registerAdjustmentUseCase =
    container.get<RegisterInventoryAdjustmentUseCase>(
      TOKENS.registerInventoryAdjustmentUseCase,
    );

  const onSuccess = () => {
    void queryClient.invalidateQueries({
      queryKey: inventoryQueryKeys.balances,
    });
    void queryClient.invalidateQueries({
      queryKey: inventoryQueryKeys.movements,
    });
  };

  return {
    registerAdjustment: useMutation({
      mutationFn: (input: RegisterAdjustmentInput) =>
        registerAdjustmentUseCase.execute(input),
      onSuccess,
    }),
    registerLoss: useMutation({
      mutationFn: (input: RegisterLossInput) => registerLossUseCase.execute(input),
      onSuccess,
    }),
  };
}
