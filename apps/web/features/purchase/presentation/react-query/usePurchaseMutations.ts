"use client";

import {
  ApprovePurchaseInput,
  ApprovePurchaseUseCase,
  CancelPurchaseUseCase,
  CreatePurchaseInput,
  CreatePurchaseUseCase,
  ReceivePurchaseInput,
  ReceivePurchaseUseCase,
} from "@paobom/domain";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";

import { purchaseQueryKeys } from "./keys";

export function usePurchaseMutations() {
  const queryClient = useQueryClient();
  const createUseCase = container.get<CreatePurchaseUseCase>(
    TOKENS.createPurchaseUseCase,
  );
  const approveUseCase = container.get<ApprovePurchaseUseCase>(
    TOKENS.approvePurchaseUseCase,
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
      queryKey: ["finance"],
    });
  };

  const onReceiptSuccess = () => {
    onSuccess();
    void queryClient.invalidateQueries({
      queryKey: ["inventory"],
    });
  };

  return {
    approvePurchase: useMutation({
      mutationFn: (input: ApprovePurchaseInput) => approveUseCase.execute(input),
      onSuccess,
    }),
    cancelPurchase: useMutation({
      mutationFn: (id: string) => cancelUseCase.execute(id),
      onSuccess,
    }),
    createPurchase: useMutation({
      mutationFn: (input: CreatePurchaseInput) => createUseCase.execute(input),
      onSuccess: onCreateSuccess,
    }),
    receivePurchase: useMutation({
      mutationFn: (input: string | ReceivePurchaseInput) =>
        receiveUseCase.execute(input),
      onSuccess: onReceiptSuccess,
    }),
  };
}
