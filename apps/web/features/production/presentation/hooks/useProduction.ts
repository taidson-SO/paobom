"use client";

import { useProductionMutations } from "@/features/production/presentation/react-query/useProductionMutations";
import {
  useProductionOrdersQuery,
  useRecipesQuery,
} from "@/features/production/presentation/react-query/useProductionQueries";
import { useProductionUIStore } from "@/features/production/presentation/stores/ProductionUIStore";

export function useProduction() {
  const recipesQuery = useRecipesQuery();
  const ordersQuery = useProductionOrdersQuery();
  const mutations = useProductionMutations();
  const selectedRecipeId = useProductionUIStore(
    (state) => state.selectedRecipeId,
  );
  const setSelectedRecipe = useProductionUIStore(
    (state) => state.setSelectedRecipe,
  );

  return {
    ...mutations,
    orders: ordersQuery.data ?? [],
    recipes: recipesQuery.data ?? [],
    selectedRecipeId,
    setSelectedRecipe,
  };
}
