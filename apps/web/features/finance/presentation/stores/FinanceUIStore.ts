"use client";

import { create } from "zustand";

type FinanceUIState = {
  selectedStatus: "all" | "pending" | "settled";
  setSelectedStatus: (selectedStatus: FinanceUIState["selectedStatus"]) => void;
};

export const useFinanceUIStore = create<FinanceUIState>((set) => ({
  selectedStatus: "all",
  setSelectedStatus: (selectedStatus) => set({ selectedStatus }),
}));
