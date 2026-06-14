"use client";

import { SaleStatus } from "@paobom/domain";
import { create } from "zustand";

type SaleStatusFilter = "all" | SaleStatus;

type SalesUIState = {
  selectedStatus: SaleStatusFilter;
  setSelectedStatus: (selectedStatus: SaleStatusFilter) => void;
};

export const useSalesUIStore = create<SalesUIState>((set) => ({
  selectedStatus: "all",
  setSelectedStatus: (selectedStatus) => set({ selectedStatus }),
}));
