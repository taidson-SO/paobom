"use client";

import {
  CreateCustomerInput,
  CreateCustomerUseCase,
  DeactivateCustomerUseCase,
  UpdateCustomerInput,
  UpdateCustomerUseCase,
} from "@paobom/domain";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";

import { customerQueryKeys } from "./keys";

export function useCustomerMutations() {
  const queryClient = useQueryClient();
  const createUseCase = container.get<CreateCustomerUseCase>(
    TOKENS.createCustomerUseCase,
  );
  const updateUseCase = container.get<UpdateCustomerUseCase>(
    TOKENS.updateCustomerUseCase,
  );
  const deactivateUseCase = container.get<DeactivateCustomerUseCase>(
    TOKENS.deactivateCustomerUseCase,
  );

  const onSuccess = () =>
    queryClient.invalidateQueries({
      queryKey: customerQueryKeys.all,
    });

  return {
    createCustomer: useMutation({
      mutationFn: (input: CreateCustomerInput) => createUseCase.execute(input),
      onSuccess,
    }),
    deactivateCustomer: useMutation({
      mutationFn: (id: string) => deactivateUseCase.execute(id),
      onSuccess,
    }),
    updateCustomer: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string;
        input: UpdateCustomerInput;
      }) => updateUseCase.execute(id, input),
      onSuccess,
    }),
  };
}
