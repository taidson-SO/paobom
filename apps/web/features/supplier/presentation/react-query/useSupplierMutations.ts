"use client";

import {
  CreateSupplierInput,
  CreateSupplierUseCase,
  DeactivateSupplierUseCase,
  UpdateSupplierInput,
  UpdateSupplierUseCase,
} from "@paobom/domain";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";

import { supplierQueryKeys } from "./keys";

export function useSupplierMutations() {
  const queryClient = useQueryClient();
  const createUseCase = container.get<CreateSupplierUseCase>(
    TOKENS.createSupplierUseCase,
  );
  const updateUseCase = container.get<UpdateSupplierUseCase>(
    TOKENS.updateSupplierUseCase,
  );
  const deactivateUseCase = container.get<DeactivateSupplierUseCase>(
    TOKENS.deactivateSupplierUseCase,
  );

  const onSuccess = () =>
    queryClient.invalidateQueries({
      queryKey: supplierQueryKeys.all,
    });

  return {
    createSupplier: useMutation({
      mutationFn: (input: CreateSupplierInput) => createUseCase.execute(input),
      onSuccess,
    }),
    deactivateSupplier: useMutation({
      mutationFn: (id: string) => deactivateUseCase.execute(id),
      onSuccess,
    }),
    updateSupplier: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string;
        input: UpdateSupplierInput;
      }) => updateUseCase.execute(id, input),
      onSuccess,
    }),
  };
}
