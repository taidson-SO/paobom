"use client";

import { create } from "zustand";

type InventoryUIState = {
  selectedProductId: string | null;
  setSelectedProduct: (id: string | null) => void;
};

export const useInventoryUIStore = create<InventoryUIState>((set) => ({
  selectedProductId: null,
  setSelectedProduct: (id) => set({ selectedProductId: id }),
}));
