"use client";

import { create } from "zustand";

type UserUIState = {
  selectedUserId: string | null;
  setSelectedUser: (id: string | null) => void;
};

export const useUserUIStore = create<UserUIState>((set) => ({
  selectedUserId: null,
  setSelectedUser: (id) => set({ selectedUserId: id }),
}));
