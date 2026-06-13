"use client";

import {
  CancelPurchaseUseCase,
  CreatePurchaseInput,
  CreatePurchaseUseCase,
  ReceivePurchaseUseCase,
} from "@paobom/domain";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";
import { inventoryQueryKeys } from "@/features/inventory/presentation/react-query/keys";
import { financeQueryKeys } from "@/features/finance/presentation/react-query/keys";

import { purchaseQueryKeys } from "./keys";

export function usePurchaseMutations() {
  const queryClient = useQueryClient();
  const createUseCase = container.get<CreatePurchaseUseCase>(
    TOKENS.createPurchaseUseCase,
  );
  const receiveUseCase = container.get<ReceivePurchaseUseCase>(
    TOKENS.receivePurchaseUseCase,
  );
  const cancelUseCase = container.get<CancelPurchaseUseCase>(
    TOKENS.cancelPurchaseUseCase,
  );

  const onSuccess = () =>
    void queryClient.invalidateQueries({
      queryKey: purchaseQueryKeys.all,
    });

  const onCreateSuccess = () => {
    onSuccess();
    void queryClient.invalidateQueries({
      queryKey: financeQueryKeys.all,
    });
  };

  const onReceiptSuccess = () => {
    onSuccess();
    void queryClient.invalidateQueries({
      queryKey: inventoryQueryKeys.balances,
    });
    void queryClient.invalidateQueries({
      queryKey: inventoryQueryKeys.movements,
    });
  };

  return {
    cancelPurchase: useMutation({
      mutationFn: (id: string) => cancelUseCase.execute(id),
      onSuccess,
    }),
    createPurchase: useMutation({
      mutationFn: (input: CreatePurchaseInput) => createUseCase.execute(input),
      onSuccess: onCreateSuccess,
    }),
    receivePurchase: useMutation({
      mutationFn: (id: string) => receiveUseCase.execute(id),
      onSuccess: onReceiptSuccess,
    }),
  };
}
