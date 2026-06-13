"use client";

import { useSupplierMutations } from "@/features/supplier/presentation/react-query/useSupplierMutations";
import { useSuppliersQuery } from "@/features/supplier/presentation/react-query/useSuppliersQuery";
import { useSupplierUIStore } from "@/features/supplier/presentation/stores/SupplierUIStore";

export function useSuppliers() {
  const query = useSuppliersQuery();
  const mutations = useSupplierMutations();
  const selectedSupplierId = useSupplierUIStore(
    (state) => state.selectedSupplierId,
  );
  const setSelectedSupplier = useSupplierUIStore(
    (state) => state.setSelectedSupplier,
  );

  return {
    ...mutations,
    selectedSupplierId,
    setSelectedSupplier,
    suppliers: query.data ?? [],
  };
}
