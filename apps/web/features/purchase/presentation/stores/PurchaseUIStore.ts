"use client";

import { create } from "zustand";

type PurchaseUIState = {
  selectedPurchaseId: string | null;
  setSelectedPurchase: (id: string | null) => void;
};

export const usePurchaseUIStore = create<PurchaseUIState>((set) => ({
  selectedPurchaseId: null,
  setSelectedPurchase: (id) => set({ selectedPurchaseId: id }),
}));
