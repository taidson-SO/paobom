"use client";

import { useProductMutations } from "@/features/product/presentation/react-query/useProductMutations";
import { useProductsQuery } from "@/features/product/presentation/react-query/useProductsQuery";
import { useProductUIStore } from "@/features/product/presentation/stores/ProductUIStore";

export function useProducts() {
  const query = useProductsQuery();
  const mutations = useProductMutations();
  const selectedProductId = useProductUIStore((state) => state.selectedProductId);
  const setSelectedProduct = useProductUIStore(
    (state) => state.setSelectedProduct,
  );

  return {
    ...mutations,
    products: query.data ?? [],
    selectedProductId,
    setSelectedProduct,
  };
}
