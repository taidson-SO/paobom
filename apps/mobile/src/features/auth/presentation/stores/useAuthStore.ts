import { create } from "zustand";

import { MobileSession } from "@/features/auth/domain/auth";

type AuthState = {
  session: MobileSession | null;
  clearSession: () => void;
  setSession: (session: MobileSession) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  clearSession: () => set({ session: null }),
  session: null,
  setSession: (session) => set({ session }),
}));
