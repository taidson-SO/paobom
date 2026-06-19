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
const privateKeyPath = resolve(runtimeDirectory, "id_ed25519");
const publicKey = (
  await readFile(`${privateKeyPath}.pub`, "utf8")
).trim();
const bootstrapScript = await readFile(
  resolve("ops/staging/bootstrap-vps.sh"),
  "utf8",
);
const host = required(config, "STAGING_HOST");
const port = optional(config, "STAGING_SSH_PORT", "22");
const bootstrapUser = optional(config, "VPS_BOOTSTRAP_USER", "root");
const deployUser = optional(config, "STAGING_USER", "paobom-deploy");
const deployPath = optional(config, "STAGING_DEPLOY_PATH", "/opt/paobom");
const bootstrapKey = optional(config, "VPS_BOOTSTRAP_SSH_KEY");
const expectedFingerprint = optional(
  config,
  "VPS_SSH_HOST_FINGERPRINT",
);
const remotePrefix = bootstrapUser === "root" ? "env" : "sudo -n env";
const remoteCommand = [
  remotePrefix,
  `DEPLOY_USER=${shellQuote(deployUser)}`,
  `DEPLOY_PATH=${shellQuote(deployPath)}`,
  `SSH_PORT=${shellQuote(port)}`,
  `DEPLOY_PUBLIC_KEY_B64=${shellQuote(
    Buffer.from(publicKey).toString("base64"),
  )}`,
  "bash -s",
].join(" ");
const sshArguments = [
  "-p",
  port,
  "-o",
  "StrictHostKeyChecking=accept-new",
];

if (expectedFingerprint) {
  const hostKeys = capture("ssh-keyscan", ["-p", port, host]);
  const fingerprints = capture("ssh-keygen", ["-lf", "-"], hostKeys);

  if (!fingerprints.includes(expectedFingerprint)) {
    throw new Error(
      `Fingerprint SSH divergente. Esperado: ${expectedFingerprint}`,
    );
  }
}

if (bootstrapKey) {
  sshArguments.push("-i", resolve(bootstrapKey));
}

sshArguments.push(`${bootstrapUser}@${host}`, remoteCommand);
run("ssh", sshArguments, { input: bootstrapScript });

run(
  "ssh",
  [
    "-p",
    port,
    "-i",
    privateKeyPath,
    "-o",
    "StrictHostKeyChecking=accept-new",
    `${deployUser}@${host}`,
    `docker version >/dev/null && docker compose version >/dev/null && test -d ${shellQuote(
      deployPath,
    )}`,
  ],
);

console.log(`VPS preparada e acesso de deploy validado em ${host}.`);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    input: options.input,
    stdio: options.input ? ["pipe", "inherit", "inherit"] : "inherit",
  });

  if (result.status !== 0) {
    throw new Error(`${command} encerrou com codigo ${result.status ?? 1}`);
  }
}

function capture(command, args, input) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    input,
  });

  if (result.status !== 0) {
    throw new Error(`${command} encerrou com codigo ${result.status ?? 1}`);
  }

  return result.stdout ?? "";
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}
