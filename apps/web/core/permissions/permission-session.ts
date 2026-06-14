"use client";

import {
  AppUser,
  Permission,
  UserRole,
  getRolePermissions,
  hasAnyPermission,
  hasEveryPermission,
  hasPermission,
} from "@paobom/domain";
import { create } from "zustand";

export const mockUsers: AppUser[] = [
  { id: "user-owner", name: "Taidson Silva", role: "owner" },
  { id: "user-manager", name: "Gerencia", role: "manager" },
  { id: "user-cashier", name: "Caixa", role: "cashier" },
  { id: "user-baker", name: "Producao", role: "baker" },
  { id: "user-stock", name: "Estoque", role: "stock" },
  { id: "user-sales", name: "Atendimento", role: "sales" },
  { id: "user-viewer", name: "Consulta", role: "viewer" },
];

type PermissionSessionState = {
  currentUserId: string;
  setCurrentUser: (userId: string) => void;
};

export const usePermissionSessionStore = create<PermissionSessionState>(
  (set) => ({
    currentUserId: mockUsers[0].id,
    setCurrentUser: (currentUserId) => set({ currentUserId }),
  }),
);

export function usePermissionSession() {
  const currentUserId = usePermissionSessionStore(
    (state) => state.currentUserId,
  );
  const setCurrentUser = usePermissionSessionStore(
    (state) => state.setCurrentUser,
  );
  const currentUser =
    mockUsers.find((user) => user.id === currentUserId) ?? mockUsers[0];

  return {
    can: (permission: Permission) =>
      hasPermission(currentUser.role, permission),
    canAny: (permissions: Permission[]) =>
      hasAnyPermission(currentUser.role, permissions),
    canEvery: (permissions: Permission[]) =>
      hasEveryPermission(currentUser.role, permissions),
    currentUser,
    permissions: getRolePermissions(currentUser.role),
    role: currentUser.role,
    setCurrentUser,
    users: mockUsers,
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
