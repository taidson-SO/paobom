"use client";

import { useInventoryMutations } from "@/features/inventory/presentation/react-query/useInventoryMutations";
import {
  useInventoryBalancesQuery,
  useStockMovementsQuery,
} from "@/features/inventory/presentation/react-query/useInventoryQueries";
import { useInventoryUIStore } from "@/features/inventory/presentation/stores/InventoryUIStore";

export function useInventory() {
  const balancesQuery = useInventoryBalancesQuery();
  const movementsQuery = useStockMovementsQuery();
  const mutations = useInventoryMutations();
  const selectedProductId = useInventoryUIStore(
    (state) => state.selectedProductId,
  );
  const setSelectedProduct = useInventoryUIStore(
    (state) => state.setSelectedProduct,
  );

  return {
    ...mutations,
    balances: balancesQuery.data ?? [],
    movements: movementsQuery.data ?? [],
    selectedProductId,
    setSelectedProduct,
  };
}
