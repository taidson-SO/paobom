import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";
import { Prisma } from "@prisma/client";

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

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

export type AuditMetadata =
  | string
  | number
  | boolean
  | null
  | AuditMetadata[]
  | { [key: string]: AuditMetadata };

export type RateLimitStore = Map<
  string,
  {
    count: number;
    resetAt: number;
  }
>;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
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

export const rolePermissions: Record<UserRole, Permission[]> = {
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

export function getRequiredPermissions(route: {
  method: HttpMethod;
  pattern: string;
}): Permission[] | null {
  if (
    route.pattern === "/health" ||
    route.pattern === "/health/live" ||
    route.pattern === "/health/ready" ||
    route.pattern === "/metrics" ||
    route.pattern === "/auth/login"
  ) {
    return null;
  }

  if (
    route.pattern === "/auth/me" ||
    route.pattern === "/auth/logout" ||
    route.pattern === "/observability/client-errors"
  ) {
    return [];
  }

  if (route.pattern.startsWith("/products")) {
    return route.method === "GET" ? ["product:view"] : ["product:manage"];
  }

  if (route.pattern.startsWith("/suppliers")) {
    return route.method === "GET" ? ["supplier:view"] : ["supplier:manage"];
  }

  if (route.pattern.includes("/interactions")) {
    return ["crm:manage"];
  }

  if (route.pattern.startsWith("/customers")) {
    return route.method === "GET" ? ["customer:view"] : ["customer:manage"];
  }

  if (route.pattern === "/purchases") {
    return route.method === "GET" ? ["purchase:view"] : ["purchase:create"];
  }

  if (route.pattern === "/purchases/payables") {
    return ["purchase:view"];
  }

  if (route.pattern.includes("/approve")) {
    return ["purchase:create"];
  }

  if (route.pattern.includes("/receive")) {
    return ["purchase:receive"];
  }

  if (route.pattern.includes("/purchases") && route.pattern.includes("/cancel")) {
    return ["purchase:cancel"];
  }

  if (route.pattern.startsWith("/inventory")) {
    if (route.pattern === "/inventory/losses") {
      return ["inventory:register-loss"];
    }

    return route.method === "GET" ? ["inventory:view"] : ["inventory:adjust"];
  }

  if (route.pattern === "/production/recipes") {
    return route.method === "GET"
      ? ["production:view"]
      : ["production:manage-recipe"];
  }

  if (route.pattern.includes("/production/orders") && route.pattern.includes("/cancel")) {
    return ["production:cancel"];
  }

  if (route.pattern.startsWith("/production/orders")) {
    return route.method === "GET"
      ? ["production:view"]
      : ["production:manage-order"];
  }

  if (route.pattern === "/sales") {
    return route.method === "GET" ? ["sales:view"] : ["sales:create"];
  }

  if (route.pattern.includes("/sales") && route.pattern.includes("/pay")) {
    return ["sales:pay"];
  }

  if (route.pattern.includes("/sales") && route.pattern.includes("/cancel")) {
    return ["sales:cancel"];
  }

  if (route.pattern === "/cash/entries") {
    return route.method === "GET" ? ["finance:view"] : ["finance:register-entry"];
  }

  if (route.pattern.includes("/cash/entries") && route.pattern.includes("/settle")) {
    return ["finance:settle"];
  }

  if (route.pattern.includes("/cash/entries") && route.pattern.includes("/cancel")) {
    return ["finance:cancel"];
  }

  if (
    route.pattern === "/cash/registers" ||
    route.pattern === "/cash/registers/movements" ||
    route.pattern === "/cash/registers/reconciliations"
  ) {
    return ["finance:view"];
  }

  if (route.pattern.includes("/cash/registers/open")) {
    return ["finance:open-register"];
  }

  if (route.pattern.includes("/cash/registers") && route.pattern.includes("/movements")) {
    return ["finance:register-entry"];
  }

  if (route.pattern.includes("/cash/registers") && route.pattern.includes("/reconcile")) {
    return ["finance:close-register"];
  }

  if (route.pattern.includes("/cash/registers") && route.pattern.includes("/close")) {
    return ["finance:close-register"];
  }

  if (route.pattern === "/reports") {
    return ["reports:view"];
  }

  if (route.pattern === "/dashboard") {
    return ["dashboard:view"];
  }

  if (route.pattern === "/audit-logs") {
    return route.method === "GET" ? ["audit:view"] : ["audit:view"];
  }

  if (route.pattern.startsWith("/users")) {
    return ["permissions:manage"];
  }

  return [];
}

export function getBearerToken(req: Pick<IncomingMessage, "headers">) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

export function getSessionCookie(req: Pick<IncomingMessage, "headers">) {
  const cookies = req.headers.cookie?.split(";") ?? [];
  const sessionCookie = cookies
    .map((cookie) => cookie.trim().split("="))
    .find(([name]) => name === "paobom_session");

  return sessionCookie?.[1] ? decodeURIComponent(sessionCookie[1]) : null;
}

export function getClientIp(req: Pick<IncomingMessage, "headers" | "socket">) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const rawIp =
    typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0]?.trim()
      : req.socket.remoteAddress;

  return rawIp || "unknown";
}

export function checkRateLimit(
  store: RateLimitStore,
  key: string,
  options: {
    limit: number;
    now?: number;
    windowMs: number;
  },
): RateLimitResult {
  const now = options.now ?? Date.now();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });

    return {
      allowed: true,
      remaining: Math.max(0, options.limit - 1),
      retryAfterSeconds: 0,
    };
  }

  if (current.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;

  return {
    allowed: true,
    remaining: Math.max(0, options.limit - current.count),
    retryAfterSeconds: 0,
  };
}

export function hashToken(token: string) {
  return createHash("sha256")
    .update(`${process.env.AUTH_TOKEN_SECRET ?? "paobom-dev-secret"}:${token}`)
    .digest("hex");
}

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const iterations = 120000;
  const hash = pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("hex");

  return `pbkdf2_sha256$${iterations}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [algorithm, iterationsValue, salt, hash] = storedHash.split("$");

  if (algorithm !== "pbkdf2_sha256" || !iterationsValue || !salt || !hash) {
    return false;
  }

  const computed = pbkdf2Sync(
    password,
    salt,
    Number(iterationsValue),
    32,
    "sha256",
  );
  const expected = Buffer.from(hash, "hex");

  return expected.length === computed.length && timingSafeEqual(expected, computed);
}

export function sanitizeMetadata(value: unknown): AuditMetadata {
  if (value === null || value === undefined) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Prisma.Decimal.isDecimal(value)) {
    return value.toNumber();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeMetadata);
  }

  if (isRecord(value)) {
    const sanitized: Record<string, AuditMetadata> = {};

    for (const [key, entry] of Object.entries(value)) {
      sanitized[key] = isSensitiveMetadataKey(key)
        ? "[redacted]"
        : sanitizeMetadata(entry);
    }

    return sanitized;
  }

  return String(value);
}

export function isSensitiveMetadataKey(key: string) {
  return /password|token|secret|authorization|hash|key|credential|creditcard|cardnumber|cvv/i.test(
    key,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
