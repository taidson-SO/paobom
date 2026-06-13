"use client";

import { create } from "zustand";

type ProductionUIState = {
  selectedRecipeId: string | null;
  setSelectedRecipe: (id: string | null) => void;
};

export const useProductionUIStore = create<ProductionUIState>((set) => ({
  selectedRecipeId: null,
  setSelectedRecipe: (id) => set({ selectedRecipeId: id }),
}));
