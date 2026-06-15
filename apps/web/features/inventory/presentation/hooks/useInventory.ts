"use client";

import { useInventoryMutations } from "@/features/inventory/presentation/react-query/useInventoryMutations";
import {
  useInventoryBalancesQuery,
  useInventoryLotsQuery,
  usePhysicalInventoryCountsQuery,
  useStockMovementsQuery,
} from "@/features/inventory/presentation/react-query/useInventoryQueries";
import { useInventoryUIStore } from "@/features/inventory/presentation/stores/InventoryUIStore";

export function useInventory() {
  const balancesQuery = useInventoryBalancesQuery();
  const countsQuery = usePhysicalInventoryCountsQuery();
  const lotsQuery = useInventoryLotsQuery();
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
    counts: countsQuery.data ?? [],
    lots: lotsQuery.data ?? [],
    movements: movementsQuery.data ?? [],
    selectedProductId,
    setSelectedProduct,
  };
}
