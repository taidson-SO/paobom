"use client";

import { create } from "zustand";

type CustomerUIState = {
  selectedCustomerId: string | null;
  setSelectedCustomer: (id: string | null) => void;
};

export const useCustomerUIStore = create<CustomerUIState>((set) => ({
  selectedCustomerId: null,
  setSelectedCustomer: (id) => set({ selectedCustomerId: id }),
}));
