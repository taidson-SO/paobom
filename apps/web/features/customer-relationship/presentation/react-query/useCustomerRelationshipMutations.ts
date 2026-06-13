"use client";

import {
  CancelCustomerInteractionUseCase,
  CompleteCustomerInteractionUseCase,
  RegisterCustomerInteractionInput,
  RegisterCustomerInteractionUseCase,
} from "@paobom/domain";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";

import { customerRelationshipQueryKeys } from "./keys";

export function useCustomerRelationshipMutations() {
  const queryClient = useQueryClient();
  const cancelUseCase = container.get<CancelCustomerInteractionUseCase>(
    TOKENS.cancelCustomerInteractionUseCase,
  );
  const completeUseCase = container.get<CompleteCustomerInteractionUseCase>(
    TOKENS.completeCustomerInteractionUseCase,
  );
  const registerUseCase = container.get<RegisterCustomerInteractionUseCase>(
    TOKENS.registerCustomerInteractionUseCase,
  );

  const onSuccess = () =>
    void queryClient.invalidateQueries({
      queryKey: customerRelationshipQueryKeys.all,
    });

  return {
    cancelInteraction: useMutation({
      mutationFn: (id: string) => cancelUseCase.execute(id),
      onSuccess,
    }),
    completeInteraction: useMutation({
      mutationFn: (id: string) => completeUseCase.execute(id),
      onSuccess,
    }),
    registerInteraction: useMutation({
      mutationFn: (input: RegisterCustomerInteractionInput) =>
        registerUseCase.execute(input),
      onSuccess,
    }),
  };
}
