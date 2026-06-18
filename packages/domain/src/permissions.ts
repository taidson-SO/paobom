export type UserRole =
  | "owner"
  | "manager"
  | "cashier"
  | "baker"
  | "stock"
  | "sales"
  | "viewer";

export type Permission =
  | "dashboard:view"
  | "reports:view"
  | "audit:view"
  | "product:view"
  | "product:manage"
  | "supplier:view"
  | "supplier:manage"
  | "customer:view"
  | "customer:manage"
  | "crm:view"
  | "crm:manage"
  | "purchase:view"
  | "purchase:create"
  | "purchase:receive"
  | "purchase:cancel"
  | "inventory:view"
  | "inventory:adjust"
  | "inventory:register-loss"
  | "production:view"
  | "production:manage-recipe"
  | "production:manage-order"
  | "production:cancel"
  | "sales:view"
  | "sales:create"
  | "sales:pay"
  | "sales:cancel"
  | "sales:authorize-discount"
  | "sales:authorize-oversell"
  | "finance:view"
  | "finance:register-entry"
  | "finance:settle"
  | "finance:cancel"
  | "finance:open-register"
  | "finance:close-register"
  | "permissions:manage";

export type AppUser = {
  id: string;
  name: string;
  role: UserRole;
};

const allPermissions = [
  "dashboard:view",
  "reports:view",
  "audit:view",
  "product:view",
  "product:manage",
  "supplier:view",
  "supplier:manage",
  "customer:view",
  "customer:manage",
  "crm:view",
  "crm:manage",
  "purchase:view",
  "purchase:create",
  "purchase:receive",
  "purchase:cancel",
  "inventory:view",
  "inventory:adjust",
  "inventory:register-loss",
  "production:view",
  "production:manage-recipe",
  "production:manage-order",
  "production:cancel",
  "sales:view",
  "sales:create",
  "sales:pay",
  "sales:cancel",
  "sales:authorize-discount",
  "sales:authorize-oversell",
  "finance:view",
  "finance:register-entry",
  "finance:settle",
  "finance:cancel",
  "finance:open-register",
  "finance:close-register",
  "permissions:manage",
] satisfies Permission[];

const rolePermissions: Record<UserRole, Permission[]> = {
  baker: [
    "dashboard:view",
    "product:view",
    "inventory:view",
    "inventory:register-loss",
    "production:view",
    "production:manage-order",
    "production:cancel",
  ],
  cashier: [
    "dashboard:view",
    "reports:view",
    "audit:view",
    "product:view",
    "customer:view",
    "customer:manage",
    "sales:view",
    "sales:create",
    "sales:pay",
    "sales:cancel",
    "finance:view",
    "finance:register-entry",
    "finance:settle",
    "finance:cancel",
    "finance:open-register",
    "finance:close-register",
  ],
  manager: allPermissions.filter(
    (permission) => permission !== "permissions:manage",
  ),
  owner: allPermissions,
  sales: [
    "dashboard:view",
    "product:view",
    "customer:view",
    "customer:manage",
    "crm:view",
    "crm:manage",
    "sales:view",
    "sales:create",
    "sales:pay",
  ],
  stock: [
    "dashboard:view",
    "product:view",
    "supplier:view",
    "supplier:manage",
    "purchase:view",
    "purchase:create",
    "purchase:receive",
    "purchase:cancel",
    "inventory:view",
    "inventory:adjust",
    "inventory:register-loss",
  ],
  viewer: ["dashboard:view", "reports:view"],
};

export function getRolePermissions(role: UserRole) {
  return rolePermissions[role];
}

export function hasPermission(role: UserRole, permission: Permission) {
  return rolePermissions[role].includes(permission);
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]) {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function hasEveryPermission(role: UserRole, permissions: Permission[]) {
  return permissions.every((permission) => hasPermission(role, permission));
}
