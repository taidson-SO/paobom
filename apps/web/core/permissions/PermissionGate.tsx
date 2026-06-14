"use client";

import { Permission } from "@paobom/domain";
import { ReactNode } from "react";

import { usePermissionSession } from "@/core/permissions/permission-session";

export function PermissionGate({
  children,
  fallback = null,
  permission,
  permissions,
  requireAll = false,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
}) {
  const { can, canAny, canEvery } = usePermissionSession();
  const allowed = permission
    ? can(permission)
    : permissions
      ? requireAll
        ? canEvery(permissions)
        : canAny(permissions)
      : true;

  return allowed ? children : fallback;
}

export function PermissionNotice({
  description = "Seu perfil atual nao permite executar esta acao.",
  title = "Acesso restrito",
}: {
  description?: string;
  title?: string;
}) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
      <p className="text-sm font-bold text-amber-900">{title}</p>
      <p className="mt-1 text-xs leading-5 text-amber-800">{description}</p>
    </div>
  );
}
