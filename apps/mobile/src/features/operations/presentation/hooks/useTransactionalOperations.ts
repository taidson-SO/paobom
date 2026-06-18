import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";
import { useAuthStore } from "@/features/auth/presentation/stores/useAuthStore";
import {
  MobileOperationsRepository,
  SimpleSaleInput,
} from "@/features/operations/domain/mobile-operations";

const snapshotKey = ["mobile-operations", "snapshot"] as const;

export function useTransactionalOperations() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const repository = container.get<MobileOperationsRepository>(
    TOKENS.mobileOperationsRepository,
  );
  const invalidateSnapshot = () =>
    queryClient.invalidateQueries({ queryKey: snapshotKey });
  const snapshot = useQuery({
    enabled: Boolean(session),
    queryFn: () => repository.getSnapshot(session?.user.permissions ?? []),
    queryKey: snapshotKey,
  });
  const registerLoss = useMutation({
    mutationFn: (input: {
      productId: string;
      quantity: number;
      reason: string;
    }) => repository.registerLoss(input),
    onSuccess: invalidateSnapshot,
  });
  const startProduction = useMutation({
    mutationFn: (id: string) => repository.startProductionOrder(id),
    onSuccess: invalidateSnapshot,
  });
  const finishProduction = useMutation({
    mutationFn: (id: string) => repository.finishProductionOrder(id),
    onSuccess: invalidateSnapshot,
  });
  const createSale = useMutation({
    mutationFn: (input: SimpleSaleInput) =>
      repository.createSimpleSale(input),
    onSuccess: invalidateSnapshot,
  });

  return {
    createSale,
    finishProduction,
    registerLoss,
    snapshot,
    startProduction,
  };
}
