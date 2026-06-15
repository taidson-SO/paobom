"use client";

import {
  CancelCashEntryUseCase,
  CloseCashRegisterInput,
  CloseCashRegisterUseCase,
  OpenCashRegisterInput,
  OpenCashRegisterUseCase,
  RegisterCashEntryInput,
  RegisterCashEntryUseCase,
  RegisterCashRegisterMovementInput,
  RegisterCashRegisterMovementUseCase,
  ReconcileCashRegisterInput,
  ReconcileCashRegisterUseCase,
  SettleCashEntryUseCase,
} from "@paobom/domain";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";

import { financeQueryKeys } from "./keys";

export function useFinanceMutations() {
  const queryClient = useQueryClient();
  const cancelUseCase = container.get<CancelCashEntryUseCase>(
    TOKENS.cancelCashEntryUseCase,
  );
  const registerUseCase = container.get<RegisterCashEntryUseCase>(
    TOKENS.registerCashEntryUseCase,
  );
  const openCashRegisterUseCase = container.get<OpenCashRegisterUseCase>(
    TOKENS.openCashRegisterUseCase,
  );
  const closeCashRegisterUseCase = container.get<CloseCashRegisterUseCase>(
    TOKENS.closeCashRegisterUseCase,
  );
  const registerCashRegisterMovementUseCase =
    container.get<RegisterCashRegisterMovementUseCase>(
      TOKENS.registerCashRegisterMovementUseCase,
    );
  const reconcileCashRegisterUseCase = container.get<ReconcileCashRegisterUseCase>(
    TOKENS.reconcileCashRegisterUseCase,
  );
  const settleUseCase = container.get<SettleCashEntryUseCase>(
    TOKENS.settleCashEntryUseCase,
  );

  const onSuccess = () =>
    void queryClient.invalidateQueries({
      queryKey: financeQueryKeys.all,
    });

  return {
    cancelCashEntry: useMutation({
      mutationFn: (id: string) => cancelUseCase.execute(id),
      onSuccess,
    }),
    registerCashEntry: useMutation({
      mutationFn: (input: RegisterCashEntryInput) =>
        registerUseCase.execute(input),
      onSuccess,
    }),
    openCashRegister: useMutation({
      mutationFn: (input: OpenCashRegisterInput) =>
        openCashRegisterUseCase.execute(input),
      onSuccess,
    }),
    closeCashRegister: useMutation({
      mutationFn: (input: CloseCashRegisterInput) =>
        closeCashRegisterUseCase.execute(input),
      onSuccess,
    }),
    registerCashRegisterMovement: useMutation({
      mutationFn: (input: RegisterCashRegisterMovementInput) =>
        registerCashRegisterMovementUseCase.execute(input),
      onSuccess,
    }),
    reconcileCashRegister: useMutation({
      mutationFn: (input: ReconcileCashRegisterInput) =>
        reconcileCashRegisterUseCase.execute(input),
      onSuccess,
    }),
    settleCashEntry: useMutation({
      mutationFn: (id: string) => settleUseCase.execute(id),
      onSuccess,
    }),
  };
}
