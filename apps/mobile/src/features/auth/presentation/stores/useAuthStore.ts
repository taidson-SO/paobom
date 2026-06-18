import { create } from "zustand";

import { MobileSession } from "@/features/auth/domain/auth";

type AuthState = {
  session: MobileSession | null;
  status: "authenticated" | "loading" | "unauthenticated";
  clearSession: () => void;
  setSession: (session: MobileSession) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  clearSession: () => set({ session: null, status: "unauthenticated" }),
  session: null,
  setSession: (session) => set({ session, status: "authenticated" }),
  status: "loading",
}));
