import { resolve4 } from "node:dns/promises";
import { readFile } from "node:fs/promises";
import { connect } from "node:net";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { connect as connectTls } from "node:tls";
import process from "node:process";

import {
  optional,
  readEnvironmentFile,
  required,
} from "./lib/env-file.mjs";

const phaseArgument = process.argv.find(
  (value, index, values) => values[index - 1] === "--phase",
);
const configArgument = process.argv.find(
  (value, index, values) => values[index - 1] === "--env",
);
const phase = phaseArgument ?? "post-deploy";
const config = await readEnvironmentFile(
  resolve(configArgument ?? ".env.activation"),
);
const host = required(config, "STAGING_HOST");
const port = Number(optional(config, "STAGING_SSH_PORT", "22"));
const deployUser = optional(config, "STAGING_USER", "paobom-deploy");
const deployPath = optional(config, "STAGING_DEPLOY_PATH", "/opt/paobom");
const domains = [
  required(config, "STAGING_WEB_DOMAIN"),
  required(config, "STAGING_API_DOMAIN"),
  required(config, "STAGING_GRAFANA_DOMAIN"),
];
const proxied =
  optional(config, "DNS_PROXIED", "false").toLowerCase() === "true";

for (const domain of domains) {
  const addresses = await resolve4(domain);

  if (!proxied && !addresses.includes(host)) {
    throw new Error(`${domain} nao aponta para ${host}`);
  }

  console.log(`DNS OK: ${domain} -> ${addresses.join(", ")}`);
}

await checkTcp(host, port);
console.log(`SSH TCP OK: ${host}:${port}`);

const privateKeyPath = resolve(
  ".runtime/staging-activation/id_ed25519",
);
await readFile(privateKeyPath);
run("ssh", [
  "-p",
  String(port),
  "-i",
  privateKeyPath,
  "-o",
  "BatchMode=yes",
  "-o",
  "StrictHostKeyChecking=accept-new",
  `${deployUser}@${host}`,
  `docker version >/dev/null && docker compose version >/dev/null && test -d ${shellQuote(
    deployPath,
  )}`,
]);
console.log("Acesso SSH de deploy OK");

if (phase === "preflight") {
  process.exit(0);
}

const urls = [
  `https://${required(config, "STAGING_WEB_DOMAIN")}`,
  `https://${required(config, "STAGING_API_DOMAIN")}/health/ready`,
  `https://${required(config, "STAGING_GRAFANA_DOMAIN")}/login`,
];

for (const url of urls) {
  const response = await fetchWithTimeout(url, 10_000);

  if (!response.ok) {
    throw new Error(`${url} respondeu HTTP ${response.status}`);
  }

  console.log(`HTTPS OK: ${url}`);
}

for (const domain of domains) {
  const certificate = await getCertificate(domain);
  const validUntil = new Date(certificate.valid_to);
  const remainingDays = Math.floor(
    (validUntil.getTime() - Date.now()) / 86_400_000,
  );

  if (remainingDays < 14) {
    throw new Error(`Certificado de ${domain} expira em ${remainingDays} dias`);
  }

  console.log(`TLS OK: ${domain}, validade restante ${remainingDays} dias`);
}

function checkTcp(targetHost, targetPort) {
  return new Promise((resolveConnection, reject) => {
    const socket = connect({ host: targetHost, port: targetPort });
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error(`Timeout conectando em ${targetHost}:${targetPort}`));
    }, 5_000);

    socket.once("connect", () => {
      clearTimeout(timeout);
      socket.end();
      resolveConnection();
    });
    socket.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

function getCertificate(domain) {
  return new Promise((resolveCertificate, reject) => {
    const socket = connectTls(
      { host: domain, port: 443, servername: domain },
      () => {
        const certificate = socket.getPeerCertificate();
        socket.end();

        if (!certificate?.valid_to) {
          reject(new Error(`Certificado TLS ausente para ${domain}`));
          return;
        }

        resolveCertificate(certificate);
      },
    );

    socket.setTimeout(10_000, () => {
      socket.destroy();
      reject(new Error(`Timeout TLS para ${domain}`));
    });
    socket.once("error", reject);
  });
}

async function fetchWithTimeout(url, timeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });

  if (result.status !== 0) {
    throw new Error(`${command} encerrou com codigo ${result.status ?? 1}`);
  }
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}
