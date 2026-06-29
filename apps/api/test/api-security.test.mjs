import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Prisma } from "@prisma/client";

import {
  checkRateLimit,
  getAuthTokenSecret,
  getBearerToken,
  getClientIp,
  getRequiredPermissions,
  getRolesWithPermission,
  getSessionCookie,
  hashPassword,
  hashToken,
  isSensitiveMetadataKey,
  removesAdministrativeAccess,
  rolePermissions,
  sanitizeMetadata,
  shouldBlockLastAdministratorChange,
  verifyPassword,
} from "../dist/security.js";

describe("permissoes da API", () => {
  test("rotas publicas nao exigem sessao", () => {
    assert.equal(getRequiredPermissions({ method: "GET", pattern: "/health" }), null);
    assert.equal(
      getRequiredPermissions({ method: "POST", pattern: "/auth/login" }),
      null,
    );
  });

  test("rotas autenticadas sem permissao funcional exigem apenas sessao", () => {
    assert.deepEqual(
      getRequiredPermissions({ method: "GET", pattern: "/auth/me" }),
      [],
    );
    assert.deepEqual(
      getRequiredPermissions({
        method: "POST",
        pattern: "/observability/client-errors",
      }),
      [],
    );
  });

  test("mapeia permissoes operacionais por metodo e rota", () => {
    assert.deepEqual(
      getRequiredPermissions({ method: "GET", pattern: "/products" }),
      ["product:view"],
    );
    assert.deepEqual(
      getRequiredPermissions({ method: "POST", pattern: "/products" }),
      ["product:manage"],
    );
    assert.deepEqual(
      getRequiredPermissions({ method: "GET", pattern: "/metrics" }),
      ["reports:view"],
    );
    assert.deepEqual(
      getRequiredPermissions({ method: "POST", pattern: "/audit-logs" }),
      ["permissions:manage"],
    );
    assert.deepEqual(
      getRequiredPermissions({
        method: "POST",
        pattern: "/purchases/:id/receive",
      }),
      ["purchase:receive"],
    );
    assert.deepEqual(
      getRequiredPermissions({
        method: "POST",
        pattern: "/cash/registers/:id/close",
      }),
      ["finance:close-register"],
    );
  });

  test("papel manager nao recebe permissions:manage", () => {
    assert.equal(rolePermissions.owner.includes("permissions:manage"), true);
    assert.equal(rolePermissions.manager.includes("permissions:manage"), false);
  });

  test("identifica papeis administrativos", () => {
    assert.deepEqual(getRolesWithPermission("permissions:manage"), ["owner"]);
  });

  test("detecta remocao de acesso administrativo", () => {
    assert.equal(
      removesAdministrativeAccess({
        currentActive: true,
        currentRole: "owner",
        nextRole: "manager",
      }),
      true,
    );
    assert.equal(
      removesAdministrativeAccess({
        currentActive: true,
        currentRole: "owner",
        nextActive: false,
      }),
      true,
    );
    assert.equal(
      removesAdministrativeAccess({
        currentActive: true,
        currentRole: "owner",
        nextRole: "owner",
      }),
      false,
    );
  });

  test("bloqueia remocao do ultimo administrador ativo", () => {
    assert.equal(
      shouldBlockLastAdministratorChange({
        activeAdministratorCount: 1,
        currentActive: true,
        currentRole: "owner",
        nextRole: "viewer",
      }),
      true,
    );
    assert.equal(
      shouldBlockLastAdministratorChange({
        activeAdministratorCount: 2,
        currentActive: true,
        currentRole: "owner",
        nextRole: "viewer",
      }),
      false,
    );
    assert.equal(
      shouldBlockLastAdministratorChange({
        activeAdministratorCount: 1,
        currentActive: true,
        currentRole: "manager",
        nextRole: "viewer",
      }),
      false,
    );
  });
});

describe("autenticacao da API", () => {
  test("extrai bearer token e cookie de sessao", () => {
    assert.equal(
      getBearerToken({ headers: { authorization: "Bearer token-123" } }),
      "token-123",
    );
    assert.equal(
      getBearerToken({ headers: { authorization: "Basic token-123" } }),
      null,
    );
    assert.equal(
      getSessionCookie({
        headers: { cookie: "other=1; paobom_session=token%2042; theme=dark" },
      }),
      "token 42",
    );
  });

  test("gera hash de token dependente do segredo configurado", () => {
    const previousSecret = process.env.AUTH_TOKEN_SECRET;

    process.env.AUTH_TOKEN_SECRET = "secret-a";
    const hashA = hashToken("session-token");
    process.env.AUTH_TOKEN_SECRET = "secret-b";
    const hashB = hashToken("session-token");

    if (previousSecret === undefined) {
      delete process.env.AUTH_TOKEN_SECRET;
    } else {
      process.env.AUTH_TOKEN_SECRET = previousSecret;
    }

    assert.notEqual(hashA, hashB);
    assert.match(hashA, /^[a-f0-9]{64}$/);
  });

  test("exige segredo de token fora do desenvolvimento", () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousAppEnv = process.env.APP_ENV;
    const previousSecret = process.env.AUTH_TOKEN_SECRET;

    delete process.env.AUTH_TOKEN_SECRET;
    process.env.NODE_ENV = "production";
    delete process.env.APP_ENV;

    assert.throws(
      () => getAuthTokenSecret(),
      /AUTH_TOKEN_SECRET deve ser definido/,
    );

    process.env.AUTH_TOKEN_SECRET = "configured-secret";
    assert.equal(getAuthTokenSecret(), "configured-secret");

    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }

    if (previousAppEnv === undefined) {
      delete process.env.APP_ENV;
    } else {
      process.env.APP_ENV = previousAppEnv;
    }

    if (previousSecret === undefined) {
      delete process.env.AUTH_TOKEN_SECRET;
    } else {
      process.env.AUTH_TOKEN_SECRET = previousSecret;
    }
  });

  test("verifica senha PBKDF2 e rejeita formatos invalidos", () => {
    const storedHash = hashPassword("Paobom@123", "fixed-salt");

    assert.equal(verifyPassword("Paobom@123", storedHash), true);
    assert.equal(verifyPassword("senha-errada", storedHash), false);
    assert.equal(verifyPassword("Paobom@123", "plain-text"), false);
  });
});

describe("rate limit de login", () => {
  test("usa x-forwarded-for antes do endereco do socket", () => {
    assert.equal(
      getClientIp({
        headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.2" },
        socket: { remoteAddress: "127.0.0.1" },
      }),
      "203.0.113.10",
    );
  });

  test("bloqueia requisicoes acima do limite ate a janela expirar", () => {
    const store = new Map();
    const options = { limit: 2, now: 1_000, windowMs: 60_000 };

    assert.deepEqual(checkRateLimit(store, "ip:email", options), {
      allowed: true,
      remaining: 1,
      retryAfterSeconds: 0,
    });
    assert.deepEqual(checkRateLimit(store, "ip:email", options), {
      allowed: true,
      remaining: 0,
      retryAfterSeconds: 0,
    });
    assert.deepEqual(checkRateLimit(store, "ip:email", options), {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 60,
    });
    assert.deepEqual(
      checkRateLimit(store, "ip:email", { ...options, now: 61_000 }),
      {
        allowed: true,
        remaining: 1,
        retryAfterSeconds: 0,
      },
    );
  });
});

describe("auditoria da API", () => {
  test("mascara campos sensiveis em estruturas aninhadas", () => {
    const sanitized = sanitizeMetadata({
      authorization: "Bearer abc",
      body: {
        apiKey: "key",
        credentials: "creds",
        cvv: "123",
        password: "secret",
        passwordHash: "hash",
        product: "Pao frances",
        tokens: ["a", "b"],
      },
      nested: [{ apiSecret: "hidden", visible: true }],
    });

    assert.deepEqual(sanitized, {
      authorization: "[redacted]",
      body: {
        apiKey: "[redacted]",
        credentials: "[redacted]",
        cvv: "[redacted]",
        password: "[redacted]",
        passwordHash: "[redacted]",
        product: "Pao frances",
        tokens: "[redacted]",
      },
      nested: [{ apiSecret: "[redacted]", visible: true }],
    });
  });

  test("normaliza datas e decimais para JSON persistivel", () => {
    assert.deepEqual(
      sanitizeMetadata({
        amount: new Prisma.Decimal("12.34"),
        occurredAt: new Date("2026-06-29T12:00:00.000Z"),
      }),
      {
        amount: 12.34,
        occurredAt: "2026-06-29T12:00:00.000Z",
      },
    );
  });

  test("identifica chaves sensiveis por nome", () => {
    assert.equal(isSensitiveMetadataKey("password"), true);
    assert.equal(isSensitiveMetadataKey("passwordHash"), true);
    assert.equal(isSensitiveMetadataKey("apiKey"), true);
    assert.equal(isSensitiveMetadataKey("cvv"), true);
    assert.equal(isSensitiveMetadataKey("credentials"), true);
    assert.equal(isSensitiveMetadataKey("refreshToken"), true);
    assert.equal(isSensitiveMetadataKey("authorizationHeader"), true);
    assert.equal(isSensitiveMetadataKey("displayName"), false);
  });
});
