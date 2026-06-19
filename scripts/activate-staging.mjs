import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import process from "node:process";

import {
  optional,
  readEnvironmentFile,
  required,
} from "./lib/env-file.mjs";

const apply = process.argv.includes("--apply");
const configArgument = process.argv.find(
  (value, index, values) => values[index - 1] === "--env",
);
const configPath = resolve(configArgument ?? ".env.activation");
const config = await readEnvironmentFile(configPath);
const repository = required(config, "GITHUB_REPOSITORY");
const branch = optional(config, "GITHUB_DEPLOY_BRANCH", "main");

if (!apply) {
  console.log("Plano de ativacao:");
  console.log("1. Gerar segredos e chave SSH local");
  console.log("2. Preparar e proteger a VPS");
  console.log("3. Criar/atualizar registros DNS");
  console.log("4. Configurar environment, variables e secrets no GitHub");
  console.log("5. Disparar deploy com seed controlado");
  console.log("6. Validar DNS, SSH, HTTPS, certificados e smoke");
  console.log("\nNenhuma alteracao foi executada. Use --apply para ativar.");
  process.exit(0);
}

runNode("scripts/prepare-staging-activation.mjs", [configPath]);
runNode("scripts/bootstrap-staging-vps.mjs", [configPath]);
runNode("scripts/configure-staging-dns.mjs", [
  "--env",
  configPath,
  "--apply",
]);
runNode("scripts/configure-github-staging.mjs", [configPath]);
runNode("scripts/verify-staging-activation.mjs", [
  "--env",
  configPath,
  "--phase",
  "preflight",
]);

run("gh", [
  "workflow",
  "run",
  "deploy-staging.yml",
  "--repo",
  repository,
  "--ref",
  branch,
  "-f",
  "seed=true",
]);

await new Promise((resolveDelay) => setTimeout(resolveDelay, 5_000));

const runId = capture("gh", [
  "run",
  "list",
  "--repo",
  repository,
  "--workflow",
  "deploy-staging.yml",
  "--branch",
  branch,
  "--event",
  "workflow_dispatch",
  "--limit",
  "1",
  "--json",
  "databaseId",
  "--jq",
  ".[0].databaseId",
]).trim();

if (!runId) {
  throw new Error("Nao foi possivel identificar o workflow de staging");
}

run("gh", [
  "run",
  "watch",
  runId,
  "--repo",
  repository,
  "--exit-status",
]);
runNode("scripts/verify-staging-activation.mjs", [
  "--env",
  configPath,
  "--phase",
  "post-deploy",
]);

console.log("Staging ativado e validado.");

function runNode(script, args) {
  run(process.execPath, [script, ...args]);
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });

  if (result.error?.code === "ENOENT") {
    throw new Error(`Comando nao encontrado: ${command}`);
  }

  if (result.status !== 0) {
    throw new Error(`${command} encerrou com codigo ${result.status ?? 1}`);
  }
}

function capture(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });

  if (result.status !== 0) {
    process.stderr.write(result.stderr ?? "");
    throw new Error(`${command} encerrou com codigo ${result.status ?? 1}`);
  }

  return result.stdout ?? "";
}
