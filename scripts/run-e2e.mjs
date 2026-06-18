import { spawn, spawnSync } from "node:child_process";
import process from "node:process";

const databaseUrl = process.env.E2E_DATABASE_URL;
const apiPort = process.env.E2E_API_PORT ?? "3337";
const apiBaseUrl = `http://127.0.0.1:${apiPort}`;

if (!databaseUrl) {
  console.error(
    "E2E_DATABASE_URL deve apontar para um banco exclusivo de testes.",
  );
  process.exit(1);
}

try {
  assertSafeDatabase(databaseUrl);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const environment = {
  ...process.env,
  API_PORT: apiPort,
  AUTH_TOKEN_SECRET: "paobom-e2e-secret",
  DATABASE_URL: databaseUrl,
  E2E_API_BASE_URL: apiBaseUrl,
  SEED_USER_PASSWORD: "Paobom@123",
  SESSION_TTL_HOURS: "1",
};

run("pnpm", ["db:generate"], environment);
run("pnpm", ["db:deploy"], environment);
run("pnpm", ["db:seed"], environment);
run("pnpm", ["--filter", "api", "build"], environment);

const api = spawn(process.execPath, ["apps/api/dist/server.js"], {
  env: environment,
  stdio: ["ignore", "pipe", "pipe"],
});
let apiOutput = "";

api.stdout.on("data", (chunk) => {
  apiOutput += chunk.toString();
});
api.stderr.on("data", (chunk) => {
  apiOutput += chunk.toString();
});

try {
  await waitForApi(apiBaseUrl, api);

  const result = spawnSync(
    process.execPath,
    ["--test", "apps/api/test/complete-flow.e2e.test.mjs"],
    {
      env: environment,
      stdio: "inherit",
    },
  );

  if (result.status !== 0) {
    throw new Error(`Teste E2E encerrou com codigo ${result.status ?? 1}`);
  }
} catch (error) {
  if (apiOutput.trim()) {
    console.error("\n--- API E2E ---\n" + apiOutput.trim());
  }

  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await stopProcess(api);
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

async function waitForApi(baseUrl, child) {
  const deadline = Date.now() + 20_000;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error("API E2E encerrou antes de ficar disponivel");
    }

    try {
      const response = await fetch(`${baseUrl}/health`);

      if (response.ok) {
        return;
      }
    } catch {
      // API still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error("Tempo excedido aguardando a API E2E");
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
