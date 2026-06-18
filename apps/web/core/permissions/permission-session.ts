"use client";

import { AppUser, Permission, UserRole } from "@paobom/domain";
import { create } from "zustand";

import { ApiAuthenticatedUser } from "@/core/infrastructure/api/api-client";

export type WebSessionUser = ApiAuthenticatedUser & {
  role: UserRole;
};

type PermissionSessionState = {
  status: "authenticated" | "loading" | "unauthenticated";
  user: WebSessionUser | null;
  clearSession: () => void;
  setLoading: () => void;
  setUser: (user: WebSessionUser) => void;
};

export const usePermissionSessionStore = create<PermissionSessionState>(
  (set) => ({
    clearSession: () => set({ status: "unauthenticated", user: null }),
    setLoading: () => set({ status: "loading" }),
    setUser: (user) => set({ status: "authenticated", user }),
    status: "loading",
    user: null,
  }),
);

export function usePermissionSession() {
  const user = usePermissionSessionStore((state) => state.user);
  const status = usePermissionSessionStore((state) => state.status);
  const permissions = (user?.permissions ?? []) as Permission[];
  const currentUser: AppUser = {
    id: user?.id ?? "anonymous",
    name: user?.name ?? "Nao autenticado",
    role: user?.role ?? "viewer",
  };

  return {
    can: (permission: Permission) => permissions.includes(permission),
    canAny: (required: Permission[]) =>
      required.some((permission) => permissions.includes(permission)),
    canEvery: (required: Permission[]) =>
      required.every((permission) => permissions.includes(permission)),
    currentUser,
    permissions,
    role: currentUser.role,
    status,
    user,
  };
}

export function getRoleLabel(role: UserRole) {
  const labels: Record<UserRole, string> = {
    baker: "Producao",
    cashier: "Caixa",
    manager: "Gerente",
    owner: "Dono",
    sales: "Atendimento",
    stock: "Estoque",
    viewer: "Consulta",
  };

  return labels[role];
}
