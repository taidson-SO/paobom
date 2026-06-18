import process from "node:process";

const baseUrl = required("STAGING_API_URL").replace(/\/$/, "");
const email = required("STAGING_SMOKE_EMAIL");
const password = required("STAGING_SMOKE_PASSWORD");

const live = await request("/health/live", { authenticated: false });
assert(live.status === "ok", "Liveness invalida");

const ready = await request("/health/ready", { authenticated: false });
assert(ready.checks?.database === "ok", "PostgreSQL nao esta pronto");

const session = await request("/auth/login", {
  authenticated: false,
  body: { email, password },
  method: "POST",
});
const token = session.token;

assert(typeof token === "string" && token.length > 20, "Token nao retornado");

const user = await request("/auth/me", { token });
assert(user.email === email, "Sessao pertence a outro usuario");

const dashboard = await request("/dashboard", { token });
assert(dashboard && typeof dashboard === "object", "Dashboard indisponivel");

await request("/auth/logout", {
  body: {},
  method: "POST",
  token,
});

console.log("Smoke de staging concluido: health, login, sessao e dashboard.");

async function request(
  path,
  {
    authenticated = true,
    body,
    method = "GET",
    token,
  } = {},
) {
  const headers = { "Content-Type": "application/json" };

  if (authenticated) {
    if (!token) {
      throw new Error(`Token ausente para ${path}`);
    }

    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers,
    method,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `${method} ${path} falhou (${response.status}): ${
        payload.error?.message ?? "resposta invalida"
      }`,
    );
  }

  return payload.data;
}

function required(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variavel obrigatoria ausente: ${name}`);
  }

  return value;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
