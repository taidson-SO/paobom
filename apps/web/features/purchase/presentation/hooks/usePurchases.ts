"use client";

import { usePurchaseMutations } from "@/features/purchase/presentation/react-query/usePurchaseMutations";
import { usePurchasesQuery } from "@/features/purchase/presentation/react-query/usePurchasesQuery";
import { usePurchaseUIStore } from "@/features/purchase/presentation/stores/PurchaseUIStore";

export function usePurchases() {
  const query = usePurchasesQuery();
  const mutations = usePurchaseMutations();
  const selectedPurchaseId = usePurchaseUIStore(
    (state) => state.selectedPurchaseId,
  );
  const setSelectedPurchase = usePurchaseUIStore(
    (state) => state.setSelectedPurchase,
  );

  return {
    ...mutations,
    purchases: query.data ?? [],
    selectedPurchaseId,
    setSelectedPurchase,
  };
}
