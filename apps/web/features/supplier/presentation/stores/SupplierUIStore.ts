"use client";

import { create } from "zustand";

type SupplierUIState = {
  selectedSupplierId: string | null;
  setSelectedSupplier: (id: string | null) => void;
};

export const useSupplierUIStore = create<SupplierUIState>((set) => ({
  selectedSupplierId: null,
  setSelectedSupplier: (id) => set({ selectedSupplierId: id }),
}));
