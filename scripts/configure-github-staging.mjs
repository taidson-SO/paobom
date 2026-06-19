import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

import {
  optional,
  readEnvironmentFile,
  required,
} from "./lib/env-file.mjs";

const configPath = resolve(process.argv[2] ?? ".env.activation");
const config = await readEnvironmentFile(configPath);
const runtimeDirectory = resolve(".runtime/staging-activation");
const hostedEnvironment = await readFile(
  resolve(runtimeDirectory, ".env.hosted"),
  "utf8",
);
const privateKey = await readFile(
  resolve(runtimeDirectory, "id_ed25519"),
  "utf8",
);
const generatedHosted = await readEnvironmentFile(
  resolve(runtimeDirectory, ".env.hosted"),
);
const repository = required(config, "GITHUB_REPOSITORY");
const environment = optional(config, "GITHUB_ENVIRONMENT", "staging");
const apiUrl = `https://${required(config, "STAGING_API_DOMAIN")}`;
const webUrl = `https://${required(config, "STAGING_WEB_DOMAIN")}`;
const host = required(config, "STAGING_HOST");
const sshPort = optional(config, "STAGING_SSH_PORT", "22");
const knownHosts = capture("ssh-keyscan", [
  "-p",
  sshPort,
  "-H",
  host,
]);
const expectedFingerprint = optional(
  config,
  "VPS_SSH_HOST_FINGERPRINT",
);

if (!knownHosts.trim()) {
  throw new Error("Nao foi possivel obter a chave SSH da VPS");
}

if (expectedFingerprint) {
  const fingerprintOutput = capture(
    "ssh-keygen",
    ["-lf", "-"],
    knownHosts,
  );

  if (!fingerprintOutput.includes(expectedFingerprint)) {
    throw new Error(
      `Fingerprint SSH divergente. Esperado: ${expectedFingerprint}`,
    );
  }
}

run("gh", ["auth", "status"]);
run("gh", [
  "api",
  "--method",
  "PUT",
  `repos/${repository}/environments/${environment}`,
]);

setVariable("STAGING_API_URL", apiUrl);
setVariable("STAGING_WEB_URL", webUrl);

setSecret("STAGING_ENV_FILE", hostedEnvironment);
setSecret("STAGING_HOST", required(config, "STAGING_HOST"));
setSecret(
  "STAGING_SSH_PORT",
  optional(config, "STAGING_SSH_PORT", "22"),
);
setSecret("STAGING_SSH_KNOWN_HOSTS", knownHosts);
setSecret(
  "STAGING_USER",
  optional(config, "STAGING_USER", "paobom-deploy"),
);
setSecret(
  "STAGING_DEPLOY_PATH",
  optional(config, "STAGING_DEPLOY_PATH", "/opt/paobom"),
);
setSecret("STAGING_SSH_PRIVATE_KEY", privateKey);
setSecret("STAGING_GHCR_USER", required(config, "STAGING_GHCR_USER"));
setSecret("STAGING_GHCR_TOKEN", required(config, "STAGING_GHCR_TOKEN"));
setSecret(
  "STAGING_SMOKE_EMAIL",
  required(config, "STAGING_SMOKE_EMAIL"),
);
setSecret("STAGING_SMOKE_PASSWORD", generatedHosted.SEED_USER_PASSWORD);

console.log(
  `Ambiente GitHub '${environment}' configurado em ${repository}.`,
);

function setVariable(name, value) {
  run("gh", [
    "variable",
    "set",
    name,
    "--env",
    environment,
    "--repo",
    repository,
    "--body",
    value,
  ]);
}

function setSecret(name, value) {
  run(
    "gh",
    [
      "secret",
      "set",
      name,
      "--env",
      environment,
      "--repo",
      repository,
    ],
    value,
  );
}

function run(command, args, input) {
  const result = spawnSync(command, args, {
    input,
    stdio: input === undefined ? "inherit" : ["pipe", "inherit", "inherit"],
  });

  if (result.error?.code === "ENOENT") {
    throw new Error("GitHub CLI (gh) nao esta instalado");
  }

  if (result.status !== 0) {
    throw new Error(`${command} encerrou com codigo ${result.status ?? 1}`);
  }
}

function capture(command, args, input) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    input,
  });

  if (result.error?.code === "ENOENT") {
    throw new Error(`Comando nao encontrado: ${command}`);
  }

  if (result.status !== 0) {
    process.stderr.write(result.stderr ?? "");
    throw new Error(`${command} encerrou com codigo ${result.status ?? 1}`);
  }

  return result.stdout ?? "";
}
