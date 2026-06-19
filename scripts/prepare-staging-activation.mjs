import { randomBytes } from "node:crypto";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { isIP } from "node:net";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

import {
  optional,
  readEnvironmentFile,
  required,
  serializeEnvironment,
} from "./lib/env-file.mjs";

const configPath = resolve(process.argv[2] ?? ".env.activation");
const outputDirectory = resolve(".runtime/staging-activation");
const hostedPath = resolve(outputDirectory, ".env.hosted");
const privateKeyPath = resolve(outputDirectory, "id_ed25519");
const publicKeyPath = `${privateKeyPath}.pub`;
const config = await readEnvironmentFile(configPath);
const existingHosted = existsSync(hostedPath)
  ? await readEnvironmentFile(hostedPath)
  : {};

validateConfiguration(config);
await mkdir(outputDirectory, { recursive: true, mode: 0o700 });
await chmod(outputDirectory, 0o700);
ensureDeployKey();

const repository = required(config, "GITHUB_REPOSITORY").toLowerCase();
const imageOwner = repository.split("/")[0];
const postgresPassword =
  existingHosted.POSTGRES_PASSWORD ?? randomSecret(36);
const seedPassword = existingHosted.SEED_USER_PASSWORD ?? randomSecret(24);
const hostedEnvironment = {
  APP_ENV: "staging",
  STAGING_WEB_DOMAIN: required(config, "STAGING_WEB_DOMAIN"),
  STAGING_API_DOMAIN: required(config, "STAGING_API_DOMAIN"),
  STAGING_GRAFANA_DOMAIN: required(config, "STAGING_GRAFANA_DOMAIN"),
  ACME_EMAIL: required(config, "ACME_EMAIL"),
  STAGING_API_IMAGE: `ghcr.io/${imageOwner}/paobom-api:staging`,
  STAGING_WEB_IMAGE: `ghcr.io/${imageOwner}/paobom-web:staging`,
  POSTGRES_DB: "paobom_staging",
  POSTGRES_USER: "paobom_staging",
  POSTGRES_PASSWORD: postgresPassword,
  DATABASE_URL: `postgresql://paobom_staging:${encodeURIComponent(
    postgresPassword,
  )}@postgres:5432/paobom_staging?schema=public`,
  AUTH_TOKEN_SECRET:
    existingHosted.AUTH_TOKEN_SECRET ?? randomSecret(48),
  SESSION_TTL_HOURS: "12",
  SESSION_MAX_ACTIVE: "5",
  SEED_USER_PASSWORD: seedPassword,
  GRAFANA_ADMIN_USER: "paobom-ops",
  GRAFANA_ADMIN_PASSWORD:
    existingHosted.GRAFANA_ADMIN_PASSWORD ?? randomSecret(32),
  ALERT_WEBHOOK_URL: required(config, "ALERT_WEBHOOK_URL"),
};

await writeFile(hostedPath, serializeEnvironment(hostedEnvironment), {
  mode: 0o600,
});
await chmod(hostedPath, 0o600);
await writeFile(
  resolve(outputDirectory, "activation-state.json"),
  `${JSON.stringify(
    {
      configPath,
      deployPath: optional(config, "STAGING_DEPLOY_PATH", "/opt/paobom"),
      deployPublicKey: (await readFile(publicKeyPath, "utf8")).trim(),
      environment: optional(config, "GITHUB_ENVIRONMENT", "staging"),
      generatedAt: new Date().toISOString(),
      hostedEnvironmentPath: hostedPath,
      privateKeyPath,
      repository,
      seedPasswordPath: hostedPath,
    },
    null,
    2,
  )}\n`,
  { mode: 0o600 },
);

console.log(`Material de ativacao preparado em ${outputDirectory}`);
console.log(`Chave publica de deploy: ${publicKeyPath}`);
console.log(`Ambiente hospedado: ${hostedPath}`);

function ensureDeployKey() {
  if (existsSync(privateKeyPath) && existsSync(publicKeyPath)) {
    return;
  }

  const result = spawnSync(
    "ssh-keygen",
    [
      "-t",
      "ed25519",
      "-N",
      "",
      "-C",
      "paobom-staging-deploy",
      "-f",
      privateKeyPath,
    ],
    { stdio: "inherit" },
  );

  if (result.status !== 0) {
    throw new Error("Falha ao gerar chave SSH de deploy");
  }
}

function validateConfiguration(environment) {
  const domains = [
    required(environment, "STAGING_WEB_DOMAIN"),
    required(environment, "STAGING_API_DOMAIN"),
    required(environment, "STAGING_GRAFANA_DOMAIN"),
  ];

  const host = required(environment, "STAGING_HOST");
  const sshPort = Number(optional(environment, "STAGING_SSH_PORT", "22"));
  const acmeEmail = required(environment, "ACME_EMAIL");
  const alertWebhook = required(environment, "ALERT_WEBHOOK_URL");
  const repository = required(environment, "GITHUB_REPOSITORY");
  required(environment, "STAGING_SMOKE_EMAIL");

  if (isIP(host) !== 4) {
    throw new Error("STAGING_HOST deve ser um endereco IPv4");
  }

  if (!Number.isInteger(sshPort) || sshPort < 1 || sshPort > 65_535) {
    throw new Error("STAGING_SSH_PORT invalida");
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(acmeEmail)) {
    throw new Error("ACME_EMAIL invalido");
  }

  if (!/^https:\/\//.test(new URL(alertWebhook).toString())) {
    throw new Error("ALERT_WEBHOOK_URL deve usar HTTPS");
  }

  if (!/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i.test(repository)) {
    throw new Error("GITHUB_REPOSITORY deve usar o formato owner/repo");
  }

  if (new Set(domains).size !== domains.length) {
    throw new Error("Os dominios Web, API e Grafana devem ser distintos");
  }

  for (const domain of domains) {
    if (!/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain)) {
      throw new Error(`Dominio invalido: ${domain}`);
    }
  }
}

function randomSecret(size) {
  return randomBytes(size).toString("base64url");
}
