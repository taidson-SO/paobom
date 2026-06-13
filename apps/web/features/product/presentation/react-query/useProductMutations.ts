"use client";

import {
  CreateProductInput,
  CreateProductUseCase,
  DeactivateProductUseCase,
  UpdateProductInput,
  UpdateProductUseCase,
} from "@paobom/domain";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";

import { productQueryKeys } from "./keys";

export function useProductMutations() {
  const queryClient = useQueryClient();
  const createUseCase = container.get<CreateProductUseCase>(
    TOKENS.createProductUseCase,
  );
  const updateUseCase = container.get<UpdateProductUseCase>(
    TOKENS.updateProductUseCase,
  );
  const deactivateUseCase = container.get<DeactivateProductUseCase>(
    TOKENS.deactivateProductUseCase,
  );

  const onSuccess = () =>
    queryClient.invalidateQueries({
      queryKey: productQueryKeys.all,
    });

  return {
    createProduct: useMutation({
      mutationFn: (input: CreateProductInput) => createUseCase.execute(input),
      onSuccess,
    }),
    deactivateProduct: useMutation({
      mutationFn: (id: string) => deactivateUseCase.execute(id),
      onSuccess,
    }),
    updateProduct: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string;
        input: UpdateProductInput;
      }) => updateUseCase.execute(id, input),
      onSuccess,
    }),
  };
}
