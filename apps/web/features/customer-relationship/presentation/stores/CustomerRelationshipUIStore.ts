"use client";

import { CustomerInteractionStatus } from "@paobom/domain";
import { create } from "zustand";

type RelationshipStatusFilter = "all" | CustomerInteractionStatus;

type CustomerRelationshipUIState = {
  selectedStatus: RelationshipStatusFilter;
  setSelectedStatus: (selectedStatus: RelationshipStatusFilter) => void;
};

export const useCustomerRelationshipUIStore =
  create<CustomerRelationshipUIState>((set) => ({
    selectedStatus: "all",
    setSelectedStatus: (selectedStatus) => set({ selectedStatus }),
  }));
