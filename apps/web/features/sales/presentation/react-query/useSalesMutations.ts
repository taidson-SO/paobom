"use client";

import {
  CancelSaleUseCase,
  CreateSaleInput,
  CreateSaleUseCase,
  PaySaleUseCase,
} from "@paobom/domain";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";

import { salesQueryKeys } from "./keys";

export function useSalesMutations() {
  const queryClient = useQueryClient();
  const cancelUseCase = container.get<CancelSaleUseCase>(
    TOKENS.cancelSaleUseCase,
  );
  const createUseCase = container.get<CreateSaleUseCase>(
    TOKENS.createSaleUseCase,
  );
  const payUseCase = container.get<PaySaleUseCase>(TOKENS.paySaleUseCase);

  const onSuccess = () => {
    void queryClient.invalidateQueries({ queryKey: salesQueryKeys.all });
    void queryClient.invalidateQueries({ queryKey: ["inventory"] });
    void queryClient.invalidateQueries({ queryKey: ["finance"] });
  };

  return {
    cancelSale: useMutation({
      mutationFn: (id: string) => cancelUseCase.execute(id),
      onSuccess,
    }),
    createSale: useMutation({
      mutationFn: (input: CreateSaleInput) => createUseCase.execute(input),
      onSuccess,
    }),
    paySale: useMutation({
      mutationFn: (id: string) => payUseCase.execute(id),
      onSuccess,
    }),
  };
}
