import { spawn, spawnSync } from "node:child_process";
import process from "node:process";

const databaseUrl = process.env.E2E_DATABASE_URL;
const apiPort = process.env.UI_TEST_API_PORT ?? "3338";
const webPort = process.env.UI_TEST_WEB_PORT ?? "3002";
const apiBaseUrl = `http://127.0.0.1:${apiPort}`;
const webBaseUrl = `http://127.0.0.1:${webPort}`;

if (!databaseUrl) {
  console.error(
    "E2E_DATABASE_URL deve apontar para um banco exclusivo de testes.",
  );
  process.exit(1);
}

assertSafeDatabase(databaseUrl);

const environment = {
  ...process.env,
  API_PORT: apiPort,
  AUTH_TOKEN_SECRET: "paobom-ui-test-secret",
  CORS_ORIGIN: webBaseUrl,
  DATABASE_URL: databaseUrl,
  NEXT_PUBLIC_API_BASE_URL: apiBaseUrl,
  PLAYWRIGHT_BASE_URL: webBaseUrl,
  SEED_USER_PASSWORD: "Paobom@123",
  SESSION_COOKIE_SECURE: "false",
  SESSION_MAX_ACTIVE: "5",
  SESSION_TTL_HOURS: "1",
};

run("pnpm", ["db:generate"], environment);
run("pnpm", ["db:deploy"], environment);
run("pnpm", ["db:seed"], environment);
run("pnpm", ["--filter", "api", "build"], environment);
run("pnpm", ["--filter", "web", "build"], environment);

const api = start(process.execPath, ["apps/api/dist/server.js"], environment);
const web = start(
  "pnpm",
  ["--filter", "web", "exec", "next", "start", "-p", webPort],
  environment,
);

try {
  await Promise.all([
    waitForUrl(`${apiBaseUrl}/health`, api),
    waitForUrl(webBaseUrl, web),
  ]);

  const result = spawnSync(
    "pnpm",
    [
      "exec",
      "playwright",
      "test",
      "--config",
      "apps/web/playwright.config.ts",
    ],
    {
      env: environment,
      stdio: "inherit",
    },
  );

  if (result.status !== 0) {
    throw new Error(
      `Testes de interface Web encerraram com codigo ${result.status ?? 1}`,
    );
  }
} catch (error) {
  printOutput("API", api.output);
  printOutput("WEB", web.output);
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await Promise.all([stopProcess(api.child), stopProcess(web.child)]);
}

function assertSafeDatabase(value) {
  let databaseName = "";

  try {
    databaseName = new URL(value).pathname.replace(/^\//, "").toLowerCase();
  } catch {
    throw new Error("E2E_DATABASE_URL invalida");
  }

  if (!databaseName.includes("e2e") && !databaseName.includes("test")) {
    throw new Error(
      `Banco '${databaseName}' recusado: o nome deve conter 'e2e' ou 'test'.`,
    );
  }
}

function run(command, args, env) {
  const result = spawnSync(command, args, {
    env,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function start(command, args, env) {
  const child = spawn(command, args, {
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const output = { value: "" };

  child.stdout.on("data", (chunk) => {
    output.value += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    output.value += chunk.toString();
  });

  return { child, output };
}

async function waitForUrl(url, processHandle) {
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    if (processHandle.child.exitCode !== null) {
      throw new Error(`${url} encerrou antes de ficar disponivel`);
    }

    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch {
      // Service still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Tempo excedido aguardando ${url}`);
}

function printOutput(name, output) {
  if (output.value.trim()) {
    console.error(`\n--- ${name} ---\n${output.value.trim()}`);
  }
}

async function stopProcess(child) {
  if (child.exitCode !== null) {
    return;
  }

  child.kill("SIGTERM");

  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 3_000)),
  ]);

  if (child.exitCode === null) {
    child.kill("SIGKILL");
  }
}
