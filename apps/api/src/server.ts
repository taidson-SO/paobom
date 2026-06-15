import {
  createHash,
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const port = Number(process.env.API_PORT ?? process.env.PORT ?? 3333);

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

type Context = {
  body: unknown;
  currentUser: AuthenticatedUser | null;
  method: HttpMethod;
  params: Record<string, string>;
  query: URLSearchParams;
  req: IncomingMessage;
  res: ServerResponse;
};

type Handler = (context: Context) => Promise<unknown> | unknown;

type Route = {
  handler: Handler;
  method: HttpMethod;
  pattern: string;
};

type UserRole =
  | "owner"
  | "manager"
  | "cashier"
  | "baker"
  | "stock"
  | "sales"
  | "viewer";

type Permission =
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

type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  permissions: Permission[];
  role: UserRole;
  sessionId: string;
};

type AuditMetadata =
  | string
  | number
  | boolean
  | null
  | AuditMetadata[]
  | { [key: string]: AuditMetadata };

class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

const routes: Route[] = [
  route("GET", "/health", async () => ({ status: "ok", service: "paobom-api" })),
  route("POST", "/auth/login", login),
  route("GET", "/auth/me", me),
  route("POST", "/auth/logout", logout),

  route("GET", "/products", listProducts),
  route("POST", "/products", createProduct),
  route("GET", "/products/:id", getProduct),
  route("PATCH", "/products/:id", updateProduct),
  route("DELETE", "/products/:id", deactivateProduct),

  route("GET", "/suppliers", listSuppliers),
  route("POST", "/suppliers", createSupplier),
  route("PATCH", "/suppliers/:id", updateSupplier),
  route("DELETE", "/suppliers/:id", deactivateSupplier),

  route("GET", "/customers", listCustomers),
  route("POST", "/customers", createCustomer),
  route("POST", "/customers/:id/interactions", createCustomerInteraction),
  route("PATCH", "/customers/:id", updateCustomer),
  route("DELETE", "/customers/:id", deactivateCustomer),

  route("GET", "/purchases", listPurchases),
  route("POST", "/purchases", createPurchase),
  route("POST", "/purchases/:id/receive", receivePurchase),
  route("POST", "/purchases/:id/cancel", cancelPurchase),

  route("GET", "/inventory/balances", listInventoryBalances),
  route("GET", "/inventory/lots", listInventoryLots),
  route("GET", "/inventory/movements", listStockMovements),
  route("GET", "/inventory/counts", listPhysicalInventoryCounts),
  route("POST", "/inventory/counts", registerPhysicalInventoryCount),
  route("POST", "/inventory/movements", registerStockMovement),

  route("GET", "/production/recipes", listRecipes),
  route("POST", "/production/recipes", createRecipe),
  route("GET", "/production/orders", listProductionOrders),
  route("POST", "/production/orders", createProductionOrder),
  route("POST", "/production/orders/:id/start", startProductionOrder),
  route("POST", "/production/orders/:id/finish", finishProductionOrder),
  route("POST", "/production/orders/:id/cancel", cancelProductionOrder),

  route("GET", "/sales", listSales),
  route("POST", "/sales", createSale),
  route("POST", "/sales/:id/pay", paySale),
  route("POST", "/sales/:id/cancel", cancelSale),

  route("GET", "/cash/entries", listCashEntries),
  route("POST", "/cash/entries", createCashEntry),
  route("POST", "/cash/entries/:id/settle", settleCashEntry),
  route("POST", "/cash/entries/:id/cancel", cancelCashEntry),
  route("GET", "/cash/registers", listCashRegisters),
  route("POST", "/cash/registers/open", openCashRegister),
  route("POST", "/cash/registers/:id/close", closeCashRegister),

  route("GET", "/reports", getReports),
  route("GET", "/dashboard", getDashboard),

  route("GET", "/audit-logs", listAuditLogs),
  route("POST", "/audit-logs", createAuditLog),
  route("GET", "/users", listUsers),
  route("POST", "/users", createUser),
  route("PATCH", "/users/:id", updateUser),
  route("DELETE", "/users/:id", deactivateUser),
];

const server = createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  let body: unknown;
  let currentUser: AuthenticatedUser | null = null;
  let match: ReturnType<typeof matchRoute> = null;
  let method: HttpMethod | null = null;
  let requestUrl: URL | null = null;

  try {
    method = normalizeMethod(req.method);
    requestUrl = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    match = matchRoute(method, requestUrl.pathname);

    if (!match) {
      throw new HttpError(404, "Rota nao encontrada");
    }

    body = method === "GET" ? undefined : await readJsonBody(req);
    currentUser = await authorize(req, match.route);
    const result = await match.route.handler({
      body,
      currentUser,
      method,
      params: match.params,
      query: requestUrl.searchParams,
      req,
      res,
    });

    await recordRouteAudit({
      body,
      currentUser,
      error: null,
      method,
      params: match.params,
      pathname: requestUrl.pathname,
      query: requestUrl.searchParams,
      result,
      route: match.route,
    });

    sendJson(res, 200, { data: serialize(result) });
  } catch (error) {
    const statusCode = error instanceof HttpError ? error.statusCode : 500;
    const message =
      error instanceof Error ? error.message : "Erro interno do servidor";

    await recordRouteAudit({
      body,
      currentUser,
      error,
      method,
      params: match?.params ?? {},
      pathname: requestUrl?.pathname ?? req.url ?? "/",
      query: requestUrl?.searchParams ?? new URLSearchParams(),
      result: null,
      route: match?.route ?? null,
    });

    sendJson(res, statusCode, { error: { message, statusCode } });
  }
});

server.listen(port, () => {
  console.log(`PaoBom API listening on http://localhost:${port}`);
});

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

async function shutdown() {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
}

function route(method: HttpMethod, pattern: string, handler: Handler): Route {
  return { handler, method, pattern };
}

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

async function authorize(req: IncomingMessage, route: Route) {
  const requiredPermissions = getRequiredPermissions(route);

  if (requiredPermissions === null) {
    return null;
  }

  const token = getBearerToken(req);

  if (!token) {
    throw new HttpError(401, "Token de autenticacao nao informado");
  }

  const session = await prisma.authSession.findUnique({
    include: { user: true },
    where: { tokenHash: hashToken(token) },
  });

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt <= new Date() ||
    !session.user.active
  ) {
    throw new HttpError(401, "Sessao invalida ou expirada");
  }

  const user: AuthenticatedUser = {
    email: session.user.email,
    id: session.user.id,
    name: session.user.name,
    permissions: rolePermissions[session.user.role as UserRole],
    role: session.user.role as UserRole,
    sessionId: session.id,
  };

  const allowed = requiredPermissions.every((permission) =>
    user.permissions.includes(permission),
  );

  if (!allowed) {
    await recordAuthorizationFailure(route, user, requiredPermissions);
    throw new HttpError(403, "Usuario sem permissao para executar esta acao");
  }

  return user;
}

async function recordAuthorizationFailure(
  route: Route,
  user: AuthenticatedUser,
  requiredPermissions: Permission[],
) {
  try {
    const entity = getAuditEntity(route.pattern);

    await prisma.auditLog.create({
      data: {
        action: `${entity}.authorize`,
        description: "Falha de autorizacao no backend",
        entity,
        entityId: null,
        metadata: {
          method: route.method,
          requiredPermissions,
          route: route.pattern,
          userPermissions: user.permissions,
        },
        occurredAt: new Date(),
        result: "failure",
        userId: user.id,
        userName: user.name,
        userRole: user.role,
      },
    });
  } catch (auditError) {
    console.error("Falha ao registrar auditoria de autorizacao", auditError);
  }
}

function getRequiredPermissions(route: Route): Permission[] | null {
  if (
    route.pattern === "/health" ||
    route.pattern === "/auth/login"
  ) {
    return null;
  }

  if (route.pattern === "/auth/me" || route.pattern === "/auth/logout") {
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

  if (route.pattern.includes("/receive")) {
    return ["purchase:receive"];
  }

  if (route.pattern.includes("/purchases") && route.pattern.includes("/cancel")) {
    return ["purchase:cancel"];
  }

  if (route.pattern.startsWith("/inventory")) {
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

  if (route.pattern === "/cash/registers") {
    return ["finance:view"];
  }

  if (route.pattern.includes("/cash/registers/open")) {
    return ["finance:open-register"];
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

function getBearerToken(req: IncomingMessage) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

function hashToken(token: string) {
  return createHash("sha256")
    .update(`${process.env.AUTH_TOKEN_SECRET ?? "paobom-dev-secret"}:${token}`)
    .digest("hex");
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const iterations = 120000;
  const hash = pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("hex");

  return `pbkdf2_sha256$${iterations}$${salt}$${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
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

type RouteAuditInput = {
  body: unknown;
  currentUser: AuthenticatedUser | null;
  error: unknown;
  method: HttpMethod | null;
  params: Record<string, string>;
  pathname: string;
  query: URLSearchParams;
  result: unknown;
  route: Route | null;
};

async function recordRouteAudit(input: RouteAuditInput) {
  const auditEvent = getAuditEvent(input);

  if (!auditEvent) {
    return;
  }

  try {
    await prisma.auditLog.create({
      data: {
        action: auditEvent.action,
        description: auditEvent.description,
        entity: auditEvent.entity,
        entityId: auditEvent.entityId,
        metadata: auditEvent.metadata as Prisma.InputJsonValue,
        occurredAt: new Date(),
        result: input.error ? "failure" : "success",
        userId: input.currentUser?.id ?? "anonymous",
        userName: input.currentUser?.name ?? "Nao autenticado",
        userRole: input.currentUser?.role ?? "anonymous",
      },
    });
  } catch (auditError) {
    console.error("Falha ao registrar auditoria", auditError);
  }
}

function getAuditEvent(input: RouteAuditInput) {
  if (!input.method) {
    return null;
  }

  if (input.route?.pattern === "/auth/logout") {
    return null;
  }

  if (input.route?.pattern === "/audit-logs" && input.method === "POST") {
    return null;
  }

  if (input.route?.pattern === "/auth/login") {
    if (!input.error) {
      return null;
    }

    const body = isRecord(input.body) ? input.body : {};

    return {
      action: "auth.login",
      description: input.error
        ? "Falha de login na API"
        : "Login realizado na API",
      entity: "auth_session",
      entityId: extractEntityId(input.result),
      metadata: sanitizeMetadata({
        email: typeof body.email === "string" ? body.email : null,
        path: input.pathname,
        status: input.error ? getErrorStatus(input.error) : 200,
      }),
    };
  }

  if (input.method === "GET") {
    return null;
  }

  const entity = getAuditEntity(input.route?.pattern ?? input.pathname);
  const operation = getAuditOperation(input.method, input.route?.pattern ?? "");
  const action = `${entity}.${operation}`;

  return {
    action,
    description: input.error
      ? `Falha ao executar ${action}`
      : `Acao ${action} executada com sucesso`,
    entity,
    entityId: input.params.id ?? extractEntityId(input.result),
    metadata: sanitizeMetadata({
      body: input.body,
      error: input.error instanceof Error ? input.error.message : null,
      method: input.method,
      params: input.params,
      path: input.pathname,
      query: Object.fromEntries(input.query.entries()),
      route: input.route?.pattern ?? null,
      status: input.error ? getErrorStatus(input.error) : 200,
    }),
  };
}

function getAuditEntity(pattern: string) {
  if (pattern.startsWith("/products")) return "product";
  if (pattern.startsWith("/suppliers")) return "supplier";
  if (pattern.includes("/interactions")) return "customer_interaction";
  if (pattern.startsWith("/customers")) return "customer";
  if (pattern.startsWith("/purchases")) return "purchase";
  if (pattern.startsWith("/inventory")) return "inventory";
  if (pattern.startsWith("/production/recipes")) return "recipe";
  if (pattern.startsWith("/production/orders")) return "production_order";
  if (pattern.startsWith("/sales")) return "sale";
  if (pattern.startsWith("/cash/entries")) return "cash_entry";
  if (pattern.startsWith("/cash/registers")) return "cash_register";
  if (pattern.startsWith("/users")) return "user";
  if (pattern.startsWith("/auth")) return "auth_session";

  return "api";
}

function getAuditOperation(method: HttpMethod, pattern: string) {
  if (pattern.includes("/receive")) return "receive";
  if (pattern.includes("/start")) return "start";
  if (pattern.includes("/finish")) return "finish";
  if (pattern.includes("/pay")) return "pay";
  if (pattern.includes("/settle")) return "settle";
  if (pattern.includes("/open")) return "open";
  if (pattern.includes("/close")) return "close";
  if (pattern.includes("/cancel")) return "cancel";
  if (method === "POST") return "create";
  if (method === "PATCH") return "update";
  if (method === "DELETE") return "deactivate";

  return method.toLowerCase();
}

function extractEntityId(value: unknown): string | null {
  if (isRecord(value) && typeof value.id === "string") {
    return value.id;
  }

  if (isRecord(value) && isRecord(value.user) && typeof value.user.id === "string") {
    return value.user.id;
  }

  return null;
}

function getErrorStatus(error: unknown) {
  return error instanceof HttpError ? error.statusCode : 500;
}

function sanitizeMetadata(value: unknown): AuditMetadata {
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

function isSensitiveMetadataKey(key: string) {
  const normalized = key.toLowerCase();

  return (
    normalized.includes("password") ||
    normalized.includes("token") ||
    normalized.includes("authorization") ||
    normalized.includes("secret")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeMethod(method?: string): HttpMethod {
  if (
    method === "GET" ||
    method === "POST" ||
    method === "PATCH" ||
    method === "DELETE"
  ) {
    return method;
  }

  throw new HttpError(405, "Metodo HTTP nao suportado");
}

function matchRoute(method: HttpMethod, pathname: string) {
  for (const route of routes) {
    if (route.method !== method) {
      continue;
    }

    const params = matchPattern(route.pattern, pathname);

    if (params) {
      return { params, route };
    }
  }

  return null;
}

function matchPattern(pattern: string, pathname: string) {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return null;
  }

  return patternParts.reduce<Record<string, string> | null>(
    (params, patternPart, index) => {
      if (!params) {
        return null;
      }

      const pathPart = pathParts[index];

      if (patternPart.startsWith(":")) {
        params[patternPart.slice(1)] = decodeURIComponent(pathPart);
        return params;
      }

      return patternPart === pathPart ? params : null;
    },
    {},
  );
}

async function readJsonBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();

  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new HttpError(400, "JSON invalido");
  }
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function setCorsHeaders(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN ?? "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

function serialize(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Prisma.Decimal.isDecimal(value)) {
    return value.toNumber();
  }

  if (Array.isArray(value)) {
    return value.map(serialize);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, serialize(entry)]),
    );
  }

  return value;
}

function bodyAsRecord(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Corpo da requisicao deve ser um objeto JSON");
  }

  return body as Record<string, unknown>;
}

function stringField(body: Record<string, unknown>, field: string) {
  const value = body[field];

  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(400, `Campo '${field}' deve ser informado`);
  }

  return value.trim();
}

function optionalStringField(body: Record<string, unknown>, field: string) {
  const value = body[field];

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberField(body: Record<string, unknown>, field: string) {
  const value = Number(body[field]);

  if (!Number.isFinite(value)) {
    throw new HttpError(400, `Campo '${field}' deve ser numerico`);
  }

  return value;
}

function optionalNumberField(body: Record<string, unknown>, field: string, fallback = 0) {
  if (body[field] === undefined || body[field] === null || body[field] === "") {
    return fallback;
  }

  return numberField(body, field);
}

function dateField(body: Record<string, unknown>, field: string) {
  const value = new Date(stringField(body, field));

  if (Number.isNaN(value.getTime())) {
    throw new HttpError(400, `Campo '${field}' deve ser uma data valida`);
  }

  return value;
}

function optionalDateQuery(query: URLSearchParams, field: string) {
  const value = query.get(field);

  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, `Parametro '${field}' deve ser uma data valida`);
  }

  return date;
}

function booleanQuery(query: URLSearchParams, field: string) {
  const value = query.get(field);

  if (value === null) {
    return undefined;
  }

  return value === "true";
}

async function login({ body }: Context) {
  const input = bodyAsRecord(body);
  const email = stringField(input, "email").toLowerCase();
  const password = stringField(input, "password");
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
    throw new HttpError(401, "Credenciais invalidas");
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date();

  expiresAt.setHours(
    expiresAt.getHours() + Number(process.env.SESSION_TTL_HOURS ?? 12),
  );

  const session = await prisma.authSession.create({
    data: {
      expiresAt,
      tokenHash: hashToken(token),
      user: { connect: { id: user.id } },
    },
  });
  const role = user.role as UserRole;

  await prisma.auditLog.create({
    data: {
      action: "auth.login",
      description: "Login realizado na API",
      entity: "auth_session",
      entityId: session.id,
      metadata: { email: user.email },
      occurredAt: new Date(),
      result: "success",
      userId: user.id,
      userName: user.name,
      userRole: user.role,
    },
  });

  return {
    expiresAt,
    token,
    user: {
      email: user.email,
      id: user.id,
      name: user.name,
      permissions: rolePermissions[role],
      role,
    },
  };
}

async function me({ currentUser }: Context) {
  if (!currentUser) {
    throw new HttpError(401, "Usuario nao autenticado");
  }

  return currentUser;
}

async function logout({ currentUser }: Context) {
  if (!currentUser) {
    throw new HttpError(401, "Usuario nao autenticado");
  }

  await prisma.authSession.update({
    data: { revokedAt: new Date() },
    where: { id: currentUser.sessionId },
  });

  await prisma.auditLog.create({
    data: {
      action: "auth.logout",
      description: "Logout realizado na API",
      entity: "auth_session",
      entityId: currentUser.sessionId,
      metadata: {},
      occurredAt: new Date(),
      result: "success",
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
    },
  });

  return { revoked: true };
}

function requireArray(value: unknown, field: string) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new HttpError(400, `Campo '${field}' deve possuir pelo menos um item`);
  }

  return value as Record<string, unknown>[];
}

function isInboundMovement(type: string) {
  return (
    type === "purchase_in" ||
    type === "production_in" ||
    type === "production_reversal" ||
    type === "sale_reversal" ||
    type === "adjustment"
  );
}

function decimalToNumber(value: Prisma.Decimal | number | string | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}

async function applyStockMovement(
  tx: Prisma.TransactionClient,
  input: {
    productId: string;
    type: Prisma.StockMovementCreateInput["type"];
    origin: Prisma.StockMovementCreateInput["origin"];
    quantity: number;
    unitCost: number;
    reason: string;
    referenceId?: string | null;
    lotCode?: string | null;
    lotId?: string | null;
    expirationDate?: Date | null;
    supplierId?: string | null;
    purchaseId?: string | null;
    occurredAt?: Date;
  },
) {
  const lotId = await applyLotMovement(tx, input);
  const movement = await tx.stockMovement.create({
    data: {
      lot: lotId ? { connect: { id: lotId } } : undefined,
      origin: input.origin,
      product: { connect: { id: input.productId } },
      quantity: input.quantity,
      reason: input.reason,
      referenceId: input.referenceId ?? null,
      type: input.type,
      unitCost: input.unitCost,
      occurredAt: input.occurredAt ?? new Date(),
    },
  });
  const current = await tx.inventoryBalance.findUnique({
    where: { productId: input.productId },
  });
  const inbound = isInboundMovement(input.type);
  const currentQuantity = decimalToNumber(current?.quantity);
  const currentAverageCost = decimalToNumber(current?.averageCost);
  const nextQuantity = inbound
    ? currentQuantity + input.quantity
    : currentQuantity - input.quantity;
  const nextAverageCost =
    inbound && nextQuantity > 0
      ? (currentQuantity * currentAverageCost + input.quantity * input.unitCost) /
        nextQuantity
      : currentAverageCost || input.unitCost;
  const product = await tx.product.findUniqueOrThrow({
    where: { id: input.productId },
  });

  await tx.inventoryBalance.upsert({
    create: {
      averageCost: nextAverageCost,
      minimumStock: product.minimumStock,
      productId: input.productId,
      quantity: nextQuantity,
    },
    update: {
      averageCost: nextAverageCost,
      minimumStock: product.minimumStock,
      quantity: nextQuantity,
    },
    where: { productId: input.productId },
  });

  return movement;
}

async function applyLotMovement(
  tx: Prisma.TransactionClient,
  input: {
    productId: string;
    type: Prisma.StockMovementCreateInput["type"];
    origin: Prisma.StockMovementCreateInput["origin"];
    quantity: number;
    unitCost: number;
    referenceId?: string | null;
    lotCode?: string | null;
    lotId?: string | null;
    expirationDate?: Date | null;
    supplierId?: string | null;
    purchaseId?: string | null;
    occurredAt?: Date;
  },
) {
  if (isInboundMovement(input.type)) {
    return upsertInboundLot(tx, input);
  }

  return consumeOutboundLots(tx, input);
}

async function upsertInboundLot(
  tx: Prisma.TransactionClient,
  input: {
    productId: string;
    type: Prisma.StockMovementCreateInput["type"];
    origin: Prisma.StockMovementCreateInput["origin"];
    quantity: number;
    unitCost: number;
    referenceId?: string | null;
    lotCode?: string | null;
    lotId?: string | null;
    expirationDate?: Date | null;
    supplierId?: string | null;
    purchaseId?: string | null;
    occurredAt?: Date;
  },
) {
  if (input.lotId) {
    const lot = await tx.inventoryLot.findUnique({ where: { id: input.lotId } });

    if (lot) {
      const nextQuantity = decimalToNumber(lot.quantity) + input.quantity;

      await tx.inventoryLot.update({
        data: {
          quantity: nextQuantity,
          status: getLotStatus(nextQuantity, lot.expirationDate),
          unitCost: input.unitCost,
        },
        where: { id: lot.id },
      });

      return lot.id;
    }
  }

  const lotCode =
    input.lotCode ??
    `${input.origin}-${input.referenceId ?? new Date().toISOString()}-${input.productId}`.slice(
      0,
      80,
    );

  const existing = await tx.inventoryLot.findUnique({
    where: { productId_lotCode: { lotCode, productId: input.productId } },
  });

  if (existing) {
    const nextQuantity = decimalToNumber(existing.quantity) + input.quantity;

    await tx.inventoryLot.update({
      data: {
        expirationDate: input.expirationDate ?? existing.expirationDate,
        quantity: nextQuantity,
        status: getLotStatus(nextQuantity, input.expirationDate ?? existing.expirationDate),
        unitCost: input.unitCost,
      },
      where: { id: existing.id },
    });

    return existing.id;
  }

  const lot = await tx.inventoryLot.create({
    data: {
      expirationDate: input.expirationDate ?? null,
      lotCode,
      product: { connect: { id: input.productId } },
      purchase: input.purchaseId ? { connect: { id: input.purchaseId } } : undefined,
      quantity: input.quantity,
      receivedAt: input.occurredAt ?? new Date(),
      status: getLotStatus(input.quantity, input.expirationDate ?? null),
      supplier: input.supplierId ? { connect: { id: input.supplierId } } : undefined,
      unitCost: input.unitCost,
    },
  });

  return lot.id;
}

async function consumeOutboundLots(
  tx: Prisma.TransactionClient,
  input: {
    productId: string;
    quantity: number;
    lotId?: string | null;
  },
) {
  if (input.lotId) {
    const lot = await tx.inventoryLot.findUnique({ where: { id: input.lotId } });

    if (!lot) {
      throw new HttpError(404, "Lote de estoque nao encontrado");
    }

    const nextQuantity = Math.max(0, decimalToNumber(lot.quantity) - input.quantity);

    await tx.inventoryLot.update({
      data: {
        quantity: nextQuantity,
        status: getLotStatus(nextQuantity, lot.expirationDate),
      },
      where: { id: lot.id },
    });

    return lot.id;
  }

  const lots = await tx.inventoryLot.findMany({
    orderBy: [{ expirationDate: "asc" }, { receivedAt: "asc" }],
    where: {
      productId: input.productId,
      quantity: { gt: 0 },
      status: { not: "depleted" },
    },
  });
  let remaining = input.quantity;
  let firstLotId: string | null = null;

  for (const lot of lots) {
    if (remaining <= 0) {
      break;
    }

    firstLotId ??= lot.id;
    const available = decimalToNumber(lot.quantity);
    const consumed = Math.min(available, remaining);
    const nextQuantity = available - consumed;

    await tx.inventoryLot.update({
      data: {
        quantity: nextQuantity,
        status: getLotStatus(nextQuantity, lot.expirationDate),
      },
      where: { id: lot.id },
    });

    remaining -= consumed;
  }

  return firstLotId;
}

function getLotStatus(quantity: number, expirationDate: Date | null) {
  if (quantity <= 0) {
    return "depleted";
  }

  if (expirationDate && expirationDate < new Date()) {
    return "expired";
  }

  return "active";
}

function periodFilter(query: URLSearchParams) {
  return {
    endDate: optionalDateQuery(query, "endDate"),
    startDate: optionalDateQuery(query, "startDate"),
  };
}

function isWithinPeriod(date: Date | null, period: { startDate: Date | null; endDate: Date | null }) {
  if (!date) {
    return false;
  }

  if (period.startDate && date < period.startDate) {
    return false;
  }

  if (period.endDate && date > period.endDate) {
    return false;
  }

  return true;
}

async function listProducts({ query }: Context) {
  const kind = query.get("kind");

  return prisma.product.findMany({
    orderBy: { name: "asc" },
    where: {
      active: booleanQuery(query, "active"),
      kind: kind ? (kind as Prisma.ProductWhereInput["kind"]) : undefined,
    },
  });
}

async function createProduct({ body }: Context) {
  const input = bodyAsRecord(body);

  return prisma.product.create({
    data: {
      category: stringField(input, "category"),
      kind: stringField(input, "kind") as Prisma.ProductCreateInput["kind"],
      minimumStock: numberField(input, "minimumStock"),
      name: stringField(input, "name"),
      purchasePrice: numberField(input, "purchasePrice"),
      salePrice: optionalNumberField(input, "salePrice"),
      sku: stringField(input, "sku"),
      unit: stringField(input, "unit") as Prisma.ProductCreateInput["unit"],
    },
  });
}

async function getProduct({ params }: Context) {
  return findOr404(prisma.product.findUnique({ where: { id: params.id } }), "Produto");
}

async function updateProduct({ body, params }: Context) {
  const input = bodyAsRecord(body);

  return prisma.product.update({
    data: {
      active: typeof input.active === "boolean" ? input.active : undefined,
      category: typeof input.category === "string" ? input.category : undefined,
      kind:
        typeof input.kind === "string"
          ? (input.kind as Prisma.ProductUpdateInput["kind"])
          : undefined,
      minimumStock:
        input.minimumStock !== undefined ? numberField(input, "minimumStock") : undefined,
      name: typeof input.name === "string" ? input.name : undefined,
      purchasePrice:
        input.purchasePrice !== undefined ? numberField(input, "purchasePrice") : undefined,
      salePrice:
        input.salePrice !== undefined ? numberField(input, "salePrice") : undefined,
      sku: typeof input.sku === "string" ? input.sku : undefined,
      unit:
        typeof input.unit === "string"
          ? (input.unit as Prisma.ProductUpdateInput["unit"])
          : undefined,
    },
    where: { id: params.id },
  });
}

async function deactivateProduct({ params }: Context) {
  return prisma.product.update({
    data: { active: false },
    where: { id: params.id },
  });
}

async function listSuppliers({ query }: Context) {
  return prisma.supplier.findMany({
    orderBy: { name: "asc" },
    where: { active: booleanQuery(query, "active") },
  });
}

async function createSupplier({ body }: Context) {
  const input = bodyAsRecord(body);

  return prisma.supplier.create({
    data: {
      contactName: stringField(input, "contactName"),
      document: stringField(input, "document"),
      email: stringField(input, "email"),
      name: stringField(input, "name"),
      phone: stringField(input, "phone"),
    },
  });
}

async function updateSupplier({ body, params }: Context) {
  return updateSimpleEntity("supplier", params.id, body);
}

async function deactivateSupplier({ params }: Context) {
  return prisma.supplier.update({ data: { active: false }, where: { id: params.id } });
}

async function listCustomers({ query }: Context) {
  return prisma.customer.findMany({
    include: { interactions: { orderBy: { occurredAt: "desc" } } },
    orderBy: { name: "asc" },
    where: { active: booleanQuery(query, "active") },
  });
}

async function createCustomer({ body }: Context) {
  const input = bodyAsRecord(body);

  return prisma.customer.create({
    data: {
      document: stringField(input, "document"),
      email: stringField(input, "email"),
      name: stringField(input, "name"),
      notes: typeof input.notes === "string" ? input.notes : "",
      phone: stringField(input, "phone"),
    },
  });
}

async function createCustomerInteraction({ body, params }: Context) {
  const input = bodyAsRecord(body);

  return prisma.customerInteraction.create({
    data: {
      customer: { connect: { id: params.id } },
      description: stringField(input, "description"),
      occurredAt:
        typeof input.occurredAt === "string" ? new Date(input.occurredAt) : new Date(),
      type: stringField(input, "type"),
    },
  });
}

async function updateCustomer({ body, params }: Context) {
  return updateSimpleEntity("customer", params.id, body);
}

async function deactivateCustomer({ params }: Context) {
  return prisma.customer.update({ data: { active: false }, where: { id: params.id } });
}

async function updateSimpleEntity(entity: "customer" | "supplier", id: string, body: unknown) {
  const input = bodyAsRecord(body);
  const data = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );

  if (entity === "customer") {
    return prisma.customer.update({ data, where: { id } });
  }

  return prisma.supplier.update({ data, where: { id } });
}

async function listPurchases() {
  return prisma.purchase.findMany({
    include: { items: { include: { product: true } }, supplier: true },
    orderBy: { createdAt: "desc" },
  });
}

async function createPurchase({ body }: Context) {
  const input = bodyAsRecord(body);
  const items = requireArray(input.items, "items");

  return prisma.purchase.create({
    data: {
      expectedDate: dateField(input, "expectedDate"),
      items: {
        create: items.map((item) => ({
          product: { connect: { id: stringField(item, "productId") } },
          quantity: numberField(item, "quantity"),
          unitCost: numberField(item, "unitCost"),
        })),
      },
      notes: typeof input.notes === "string" ? input.notes : "",
      status: "draft",
      supplier: { connect: { id: stringField(input, "supplierId") } },
    },
    include: { items: true, supplier: true },
  });
}

async function receivePurchase({ params }: Context) {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      include: { items: true },
      where: { id: params.id },
    });

    if (!purchase) {
      throw new HttpError(404, "Compra nao encontrada");
    }

    if (purchase.status === "cancelled") {
      throw new HttpError(409, "Compra cancelada nao pode ser recebida");
    }

    for (const item of purchase.items) {
      await applyStockMovement(tx, {
        origin: "purchase",
        productId: item.productId,
        lotCode: `COMPRA-${purchase.id}-${item.productId}`,
        quantity: decimalToNumber(item.quantity),
        reason: "Recebimento de compra",
        referenceId: purchase.id,
        purchaseId: purchase.id,
        supplierId: purchase.supplierId,
        type: "purchase_in",
        unitCost: decimalToNumber(item.unitCost),
      });
    }

    return tx.purchase.update({
      data: { receivedAt: new Date(), status: "received" },
      include: { items: true, supplier: true },
      where: { id: purchase.id },
    });
  });
}

async function cancelPurchase({ params }: Context) {
  return prisma.purchase.update({
    data: { status: "cancelled" },
    include: { items: true, supplier: true },
    where: { id: params.id },
  });
}

async function listInventoryBalances() {
  return prisma.inventoryBalance.findMany({
    include: { product: true },
    orderBy: { productId: "asc" },
  });
}

async function listInventoryLots() {
  return prisma.inventoryLot.findMany({
    include: { product: true, purchase: true, supplier: true },
    orderBy: [{ expirationDate: "asc" }, { receivedAt: "desc" }],
  });
}

async function listStockMovements() {
  return prisma.stockMovement.findMany({
    include: { lot: true, product: true },
    orderBy: { occurredAt: "desc" },
  });
}

async function listPhysicalInventoryCounts() {
  return prisma.physicalInventoryCount.findMany({
    include: { product: true },
    orderBy: { countedAt: "desc" },
  });
}

async function registerPhysicalInventoryCount({ body }: Context) {
  const input = bodyAsRecord(body);
  const productId = stringField(input, "productId");
  const balance = await prisma.inventoryBalance.findUnique({ where: { productId } });
  const expectedQuantity = decimalToNumber(balance?.quantity);
  const countedQuantity = numberField(input, "countedQuantity");
  const divergenceQuantity = countedQuantity - expectedQuantity;
  const reason = optionalStringField(input, "reason");

  if (divergenceQuantity !== 0 && !reason) {
    throw new HttpError(400, "Divergencia de inventario exige justificativa");
  }

  return prisma.physicalInventoryCount.create({
    data: {
      countedBy: stringField(input, "countedBy"),
      countedQuantity,
      divergenceQuantity,
      expectedQuantity,
      product: { connect: { id: productId } },
      reason,
    },
  });
}

async function registerStockMovement({ body }: Context) {
  const input = bodyAsRecord(body);

  return prisma.$transaction((tx) =>
    applyStockMovement(tx, {
      origin: (optionalStringField(input, "origin") ?? "manual_adjustment") as Prisma.StockMovementCreateInput["origin"],
      expirationDate:
        typeof input.expirationDate === "string" ? new Date(input.expirationDate) : null,
      lotCode: optionalStringField(input, "lotCode"),
      lotId: optionalStringField(input, "lotId"),
      productId: stringField(input, "productId"),
      quantity: numberField(input, "quantity"),
      reason: stringField(input, "reason"),
      referenceId: optionalStringField(input, "referenceId"),
      type: stringField(input, "type") as Prisma.StockMovementCreateInput["type"],
      unitCost: numberField(input, "unitCost"),
    }),
  );
}

async function listRecipes() {
  return prisma.recipe.findMany({
    include: { ingredients: { include: { product: true } }, outputProduct: true },
    orderBy: [{ name: "asc" }, { version: "desc" }],
  });
}

async function createRecipe({ body }: Context) {
  const input = bodyAsRecord(body);
  const ingredients = requireArray(input.ingredients, "ingredients");
  const latest = await prisma.recipe.findFirst({
    orderBy: { version: "desc" },
    where: { name: stringField(input, "name") },
  });

  return prisma.recipe.create({
    data: {
      ingredients: {
        create: ingredients.map((ingredient) => ({
          product: { connect: { id: stringField(ingredient, "productId") } },
          quantity: numberField(ingredient, "quantity"),
        })),
      },
      name: stringField(input, "name"),
      outputProduct: { connect: { id: stringField(input, "outputProductId") } },
      version: latest ? latest.version + 1 : 1,
      yieldQuantity: numberField(input, "yieldQuantity"),
    },
    include: { ingredients: true, outputProduct: true },
  });
}

async function listProductionOrders() {
  return prisma.productionOrder.findMany({
    include: {
      ingredientConsumptions: { include: { product: true } },
      outputProduct: true,
      recipe: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

async function createProductionOrder({ body }: Context) {
  const input = bodyAsRecord(body);
  const quantityProduced = numberField(input, "quantityProduced");
  const recipe = await prisma.recipe.findUnique({
    include: { ingredients: { include: { product: true } }, outputProduct: true },
    where: { id: stringField(input, "recipeId") },
  });

  if (!recipe || !recipe.active) {
    throw new HttpError(400, "Ficha tecnica ativa deve ser informada");
  }

  const factor = quantityProduced / decimalToNumber(recipe.yieldQuantity);

  return prisma.productionOrder.create({
    data: {
      ingredientConsumptions: {
        create: recipe.ingredients.map((ingredient) => ({
          product: { connect: { id: ingredient.productId } },
          quantity: decimalToNumber(ingredient.quantity) * factor,
          unitCost: ingredient.product.purchasePrice,
        })),
      },
      notes: typeof input.notes === "string" ? input.notes : "",
      outputProduct: { connect: { id: recipe.outputProductId } },
      quantityProduced,
      recipe: { connect: { id: recipe.id } },
      recipeSnapshot: {
        ingredients: recipe.ingredients.map((ingredient) => ({
          productId: ingredient.productId,
          quantity: decimalToNumber(ingredient.quantity),
        })),
        outputProductId: recipe.outputProductId,
        recipeId: recipe.id,
        recipeName: recipe.name,
        recipeVersion: recipe.version,
        yieldQuantity: decimalToNumber(recipe.yieldQuantity),
      },
      status: "planned",
    },
    include: { ingredientConsumptions: true, recipe: true },
  });
}

async function startProductionOrder({ params }: Context) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.productionOrder.findUnique({
      include: { ingredientConsumptions: true },
      where: { id: params.id },
    });

    if (!order) {
      throw new HttpError(404, "Producao nao encontrada");
    }

    if (order.status !== "planned") {
      throw new HttpError(409, "Apenas producao planejada pode ser iniciada");
    }

    for (const consumption of order.ingredientConsumptions) {
      const balance = await tx.inventoryBalance.findUnique({
        where: { productId: consumption.productId },
      });

      if (!balance || decimalToNumber(balance.quantity) < decimalToNumber(consumption.quantity)) {
        throw new HttpError(409, "Estoque insuficiente para iniciar producao");
      }
    }

    for (const consumption of order.ingredientConsumptions) {
      await applyStockMovement(tx, {
        origin: "production",
        lotId: null,
        productId: consumption.productId,
        quantity: decimalToNumber(consumption.quantity),
        reason: "Consumo de producao",
        referenceId: order.id,
        type: "production_out",
        unitCost: decimalToNumber(consumption.unitCost),
      });
    }

    return tx.productionOrder.update({
      data: { startedAt: new Date(), status: "started" },
      include: { ingredientConsumptions: true, recipe: true },
      where: { id: order.id },
    });
  });
}

async function finishProductionOrder({ params }: Context) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.productionOrder.findUnique({
      include: { ingredientConsumptions: true },
      where: { id: params.id },
    });

    if (!order || order.status !== "started") {
      throw new HttpError(409, "Apenas producao iniciada pode ser finalizada");
    }

    const totalCost = order.ingredientConsumptions.reduce(
      (sum, item) => sum + decimalToNumber(item.quantity) * decimalToNumber(item.unitCost),
      0,
    );
    const quantityProduced = decimalToNumber(order.quantityProduced);

    await applyStockMovement(tx, {
      origin: "production",
      lotCode: `PRODUCAO-${order.id}`,
      productId: order.outputProductId,
      quantity: quantityProduced,
      reason: "Entrada de producao",
      referenceId: order.id,
      type: "production_in",
      unitCost: quantityProduced > 0 ? totalCost / quantityProduced : 0,
    });

    return tx.productionOrder.update({
      data: { completedAt: new Date(), status: "finished" },
      include: { ingredientConsumptions: true, recipe: true },
      where: { id: order.id },
    });
  });
}

async function cancelProductionOrder({ params }: Context) {
  return prisma.productionOrder.update({
    data: { status: "cancelled" },
    include: { ingredientConsumptions: true, recipe: true },
    where: { id: params.id },
  });
}

async function listSales() {
  return prisma.sale.findMany({
    include: { customer: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
}

async function createSale({ body, currentUser }: Context) {
  const input = bodyAsRecord(body);
  const items = requireArray(input.items, "items");
  const discountAmount = optionalNumberField(input, "discountAmount");

  return prisma.$transaction(async (tx) => {
    const preparedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const productId = stringField(item, "productId");
      const quantity = numberField(item, "quantity");
      const unitPrice = numberField(item, "unitPrice");
      const [product, balance] = await Promise.all([
        tx.product.findUnique({ where: { id: productId } }),
        tx.inventoryBalance.findUnique({ where: { productId } }),
      ]);

      if (!product || !product.active || !["finished_product", "resale"].includes(product.kind)) {
        throw new HttpError(400, "Todos os itens devem usar produtos vendaveis ativos");
      }

      if (
        (!balance || decimalToNumber(balance.quantity) < quantity) &&
        !currentUser?.permissions.includes("sales:authorize-oversell")
      ) {
        throw new HttpError(409, "Venda acima do estoque exige responsavel");
      }

      subtotal += quantity * unitPrice;
      preparedItems.push({
        productId,
        quantity,
        unitCost: decimalToNumber(balance?.averageCost) || decimalToNumber(product.purchasePrice),
        unitPrice,
      });
    }

    if (discountAmount > subtotal) {
      throw new HttpError(400, "Desconto nao pode superar o subtotal da venda");
    }

    if (subtotal > 0 && discountAmount / subtotal > 0.1) {
      if (!currentUser?.permissions.includes("sales:authorize-discount")) {
        throw new HttpError(400, "Desconto acima do limite exige autorizacao");
      }

      if (!optionalStringField(input, "discountReason")) {
        throw new HttpError(400, "Desconto acima do limite exige justificativa");
      }
    }

    const paymentMethod = stringField(input, "paymentMethod") as Prisma.SaleCreateInput["paymentMethod"];
    const isPaidNow = paymentMethod !== "invoice";
    const sale = await tx.sale.create({
      data: {
        customer:
          typeof input.customerId === "string" && input.customerId
            ? { connect: { id: input.customerId } }
            : undefined,
        discountAmount,
        discountAuthorizedBy:
          discountAmount > 0
            ? currentUser?.id ?? null
            : optionalStringField(input, "discountAuthorizedBy"),
        discountReason: optionalStringField(input, "discountReason"),
        items: {
          create: preparedItems.map((item) => ({
            product: { connect: { id: item.productId } },
            quantity: item.quantity,
            unitCost: item.unitCost,
            unitPrice: item.unitPrice,
          })),
        },
        notes: typeof input.notes === "string" ? input.notes : "",
        oversellApprovedBy: optionalStringField(input, "oversellApprovedBy") ?? currentUser?.id ?? null,
        oversellJustification: optionalStringField(input, "oversellJustification"),
        paidAt: isPaidNow ? new Date() : null,
        paymentMethod,
        status: isPaidNow ? "paid" : "open",
      },
      include: { items: true },
    });

    for (const item of preparedItems) {
      await applyStockMovement(tx, {
        origin: "sale",
        lotId: null,
        productId: item.productId,
        quantity: item.quantity,
        reason: "Venda",
        referenceId: sale.id,
        type: "sale_out",
        unitCost: item.unitCost,
      });
    }

    await tx.cashEntry.create({
      data: {
        amount: Math.max(0, subtotal - discountAmount),
        category: "Vendas",
        description: `Venda ${sale.id}`,
        dueDate: new Date(),
        referenceId: sale.id,
        settledAt: isPaidNow ? new Date() : null,
        status: isPaidNow ? "settled" : "pending",
        type: "income",
      },
    });

    return sale;
  });
}

async function paySale({ params }: Context) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.update({
      data: { paidAt: new Date(), status: "paid" },
      include: { items: true },
      where: { id: params.id },
    });
    const total =
      sale.items.reduce(
        (sum, item) => sum + decimalToNumber(item.quantity) * decimalToNumber(item.unitPrice),
        0,
      ) - decimalToNumber(sale.discountAmount);

    await tx.cashEntry.create({
      data: {
        amount: Math.max(0, total),
        category: "Vendas",
        description: `Pagamento da venda ${sale.id}`,
        dueDate: new Date(),
        referenceId: sale.id,
        settledAt: new Date(),
        status: "settled",
        type: "income",
      },
    });

    return sale;
  });
}

async function cancelSale({ params }: Context) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({
      include: { items: true },
      where: { id: params.id },
    });

    if (!sale) {
      throw new HttpError(404, "Venda nao encontrada");
    }

    for (const item of sale.items) {
      await applyStockMovement(tx, {
        origin: "sale",
        lotId: null,
        productId: item.productId,
        quantity: decimalToNumber(item.quantity),
        reason: "Cancelamento de venda",
        referenceId: sale.id,
        type: "sale_reversal",
        unitCost: decimalToNumber(item.unitCost),
      });
    }

    await tx.cashEntry.updateMany({
      data: { status: "cancelled" },
      where: { referenceId: sale.id },
    });

    return tx.sale.update({
      data: { status: "cancelled" },
      include: { items: true },
      where: { id: sale.id },
    });
  });
}

async function listCashEntries() {
  return prisma.cashEntry.findMany({ orderBy: { dueDate: "desc" } });
}

async function createCashEntry({ body }: Context) {
  const input = bodyAsRecord(body);

  return prisma.cashEntry.create({
    data: {
      amount: numberField(input, "amount"),
      category: stringField(input, "category"),
      description: stringField(input, "description"),
      dueDate: dateField(input, "dueDate"),
      referenceId: optionalStringField(input, "referenceId"),
      settledAt:
        typeof input.settledAt === "string" ? new Date(input.settledAt) : null,
      status:
        (optionalStringField(input, "status") as Prisma.CashEntryCreateInput["status"]) ??
        "pending",
      type: stringField(input, "type") as Prisma.CashEntryCreateInput["type"],
    },
  });
}

async function settleCashEntry({ params }: Context) {
  return prisma.cashEntry.update({
    data: { settledAt: new Date(), status: "settled" },
    where: { id: params.id },
  });
}

async function cancelCashEntry({ params }: Context) {
  return prisma.cashEntry.update({
    data: { status: "cancelled" },
    where: { id: params.id },
  });
}

async function listCashRegisters() {
  return prisma.cashRegister.findMany({ orderBy: { openedAt: "desc" } });
}

async function openCashRegister({ body }: Context) {
  const input = bodyAsRecord(body);
  const current = await prisma.cashRegister.findFirst({ where: { status: "open" } });

  if (current) {
    throw new HttpError(409, "Ja existe um caixa aberto");
  }

  return prisma.cashRegister.create({
    data: {
      openedAt: new Date(),
      openedBy: stringField(input, "openedBy"),
      openingAmount: numberField(input, "openingAmount"),
      status: "open",
    },
  });
}

async function closeCashRegister({ body, params }: Context) {
  const input = bodyAsRecord(body);
  const register = await prisma.cashRegister.findUnique({ where: { id: params.id } });

  if (!register || register.status !== "open") {
    throw new HttpError(409, "Caixa aberto deve ser informado");
  }

  const entries = await prisma.cashEntry.findMany({
    where: {
      settledAt: { gte: register.openedAt },
      status: "settled",
    },
  });
  const expectedAmount = entries.reduce((sum, entry) => {
    const signed = entry.type === "income" ? 1 : -1;

    return sum + signed * decimalToNumber(entry.amount);
  }, decimalToNumber(register.openingAmount));
  const countedAmount = numberField(input, "countedAmount");
  const differenceAmount = countedAmount - expectedAmount;

  if (differenceAmount !== 0 && !optionalStringField(input, "closingNote")) {
    throw new HttpError(400, "Fechamento com divergencia exige justificativa");
  }

  return prisma.cashRegister.update({
    data: {
      closedAt: new Date(),
      closedBy: stringField(input, "closedBy"),
      closingNote: optionalStringField(input, "closingNote"),
      countedAmount,
      differenceAmount,
      expectedAmount,
      status: "closed",
    },
    where: { id: params.id },
  });
}

async function getReports({ query }: Context) {
  const period = periodFilter(query);
  const [sales, cashEntries, balances, movements, purchases, productions] =
    await Promise.all([
      prisma.sale.findMany({ include: { items: true } }),
      prisma.cashEntry.findMany(),
      prisma.inventoryBalance.findMany(),
      prisma.stockMovement.findMany(),
      prisma.purchase.findMany({ include: { items: true } }),
      prisma.productionOrder.findMany({ include: { ingredientConsumptions: true } }),
    ]);
  const paidSales = sales.filter(
    (sale) => sale.status === "paid" && isWithinPeriod(sale.paidAt ?? sale.createdAt, period),
  );
  const revenue = paidSales.reduce((sum, sale) => sum + saleTotal(sale), 0);
  const totalCost = paidSales.reduce((sum, sale) => sum + saleCost(sale), 0);
  const activeCash = cashEntries.filter((entry) => entry.status !== "cancelled");

  return {
    cashFlow: {
      balance: activeCash.reduce(
        (sum, entry) =>
          entry.status === "settled"
            ? sum + (entry.type === "income" ? 1 : -1) * decimalToNumber(entry.amount)
            : sum,
        0,
      ),
      projectedBalance: activeCash.reduce(
        (sum, entry) => sum + (entry.type === "income" ? 1 : -1) * decimalToNumber(entry.amount),
        0,
      ),
    },
    generatedAt: new Date(),
    inventory: {
      belowMinimum: balances.filter(
        (balance) => decimalToNumber(balance.quantity) < decimalToNumber(balance.minimumStock),
      ).length,
      estimatedValue: balances.reduce(
        (sum, balance) =>
          sum + decimalToNumber(balance.quantity) * decimalToNumber(balance.averageCost),
        0,
      ),
      movements: movements.length,
    },
    period,
    production: {
      orders: productions.length,
      totalCost: productions.reduce((sum, order) => sum + productionCost(order), 0),
      totalProduced: productions.reduce(
        (sum, order) => sum + decimalToNumber(order.quantityProduced),
        0,
      ),
    },
    purchases: {
      totalPurchased: purchases.reduce((sum, purchase) => {
        if (purchase.status === "cancelled") return sum;
        return (
          sum +
          purchase.items.reduce(
            (itemSum, item) =>
              itemSum + decimalToNumber(item.quantity) * decimalToNumber(item.unitCost),
            0,
          )
        );
      }, 0),
    },
    sales: {
      grossMargin: revenue - totalCost,
      grossMarginRate: revenue > 0 ? (revenue - totalCost) / revenue : 0,
      totalCost,
      totalRevenue: revenue,
    },
  };
}

async function getDashboard({ query }: Context) {
  const reports = await getReports({ query } as Context);
  const data = reports as Awaited<ReturnType<typeof getReports>>;

  return {
    generatedAt: data.generatedAt,
    health: {
      score: calculateHealthScore(data.sales.grossMarginRate, data.cashFlow.projectedBalance),
      status:
        calculateHealthScore(data.sales.grossMarginRate, data.cashFlow.projectedBalance) >= 70
          ? "healthy"
          : "attention",
    },
    indicators: {
      inventoryEstimatedValue: data.inventory.estimatedValue,
      netCashProjection: data.cashFlow.projectedBalance,
      productsBelowMinimum: data.inventory.belowMinimum,
      totalRevenue: data.sales.totalRevenue,
    },
    reports: data,
  };
}

function calculateHealthScore(grossMarginRate: number, projectedBalance: number) {
  let score = 60;

  if (grossMarginRate >= 0.45) score += 25;
  else if (grossMarginRate >= 0.25) score += 15;

  if (projectedBalance >= 0) score += 15;

  return Math.max(0, Math.min(100, score));
}

function saleTotal(sale: Prisma.SaleGetPayload<{ include: { items: true } }>) {
  const subtotal = sale.items.reduce(
    (sum, item) => sum + decimalToNumber(item.quantity) * decimalToNumber(item.unitPrice),
    0,
  );

  return Math.max(0, subtotal - decimalToNumber(sale.discountAmount));
}

function saleCost(sale: Prisma.SaleGetPayload<{ include: { items: true } }>) {
  return sale.items.reduce(
    (sum, item) => sum + decimalToNumber(item.quantity) * decimalToNumber(item.unitCost),
    0,
  );
}

function productionCost(
  order: Prisma.ProductionOrderGetPayload<{ include: { ingredientConsumptions: true } }>,
) {
  return order.ingredientConsumptions.reduce(
    (sum, item) => sum + decimalToNumber(item.quantity) * decimalToNumber(item.unitCost),
    0,
  );
}

async function listAuditLogs({ query }: Context) {
  return prisma.auditLog.findMany({
    orderBy: { occurredAt: "desc" },
    where: {
      action: query.get("action") ?? undefined,
      entity: query.get("entity") ?? undefined,
      userId: query.get("userId") ?? undefined,
    },
  });
}

async function createAuditLog({ body }: Context) {
  const input = bodyAsRecord(body);

  return prisma.auditLog.create({
    data: {
      action: stringField(input, "action"),
      description: stringField(input, "description"),
      entity: stringField(input, "entity"),
      entityId: optionalStringField(input, "entityId"),
      metadata:
        input.metadata && typeof input.metadata === "object"
          ? (input.metadata as Prisma.InputJsonObject)
          : {},
      occurredAt:
        typeof input.occurredAt === "string" ? new Date(input.occurredAt) : new Date(),
      result: stringField(input, "result") as Prisma.AuditLogCreateInput["result"],
      userId: stringField(input, "userId"),
      userName: stringField(input, "userName"),
      userRole: stringField(input, "userRole"),
    },
  });
}

async function listUsers() {
  return prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      active: true,
      createdAt: true,
      email: true,
      id: true,
      name: true,
      role: true,
      updatedAt: true,
    },
  });
}

async function createUser({ body }: Context) {
  const input = bodyAsRecord(body);
  const role = stringField(input, "role") as UserRole;

  if (!rolePermissions[role]) {
    throw new HttpError(400, "Papel de usuario invalido");
  }

  return prisma.user.create({
    data: {
      email: stringField(input, "email").toLowerCase(),
      name: stringField(input, "name"),
      passwordHash: hashPassword(stringField(input, "password")),
      role,
    },
    select: {
      active: true,
      createdAt: true,
      email: true,
      id: true,
      name: true,
      role: true,
      updatedAt: true,
    },
  });
}

async function updateUser({ body, params }: Context) {
  const input = bodyAsRecord(body);
  const role = typeof input.role === "string" ? (input.role as UserRole) : undefined;

  if (role && !rolePermissions[role]) {
    throw new HttpError(400, "Papel de usuario invalido");
  }

  return prisma.user.update({
    data: {
      active: typeof input.active === "boolean" ? input.active : undefined,
      email: typeof input.email === "string" ? input.email.toLowerCase() : undefined,
      name: typeof input.name === "string" ? input.name : undefined,
      passwordHash:
        typeof input.password === "string" && input.password
          ? hashPassword(input.password)
          : undefined,
      role,
    },
    select: {
      active: true,
      createdAt: true,
      email: true,
      id: true,
      name: true,
      role: true,
      updatedAt: true,
    },
    where: { id: params.id },
  });
}

async function deactivateUser({ params }: Context) {
  await prisma.authSession.updateMany({
    data: { revokedAt: new Date() },
    where: { userId: params.id, revokedAt: null },
  });

  return prisma.user.update({
    data: { active: false },
    select: {
      active: true,
      createdAt: true,
      email: true,
      id: true,
      name: true,
      role: true,
      updatedAt: true,
    },
    where: { id: params.id },
  });
}

async function findOr404<T>(promise: Promise<T | null>, entity: string) {
  const result = await promise;

  if (!result) {
    throw new HttpError(404, `${entity} nao encontrado`);
  }

  return result;
}
