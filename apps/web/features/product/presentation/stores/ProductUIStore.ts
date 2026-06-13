"use client";

import { create } from "zustand";

type ProductUIState = {
  selectedProductId: string | null;
  setSelectedProduct: (id: string | null) => void;
};

export const useProductUIStore = create<ProductUIState>((set) => ({
  selectedProductId: null,
  setSelectedProduct: (id) => set({ selectedProductId: id }),
}));
