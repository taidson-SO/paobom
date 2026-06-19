import { isIP } from "node:net";
import { resolve4 } from "node:dns/promises";
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
const config = await readEnvironmentFile(
  resolve(configArgument ?? ".env.activation"),
);
const provider = optional(config, "DNS_PROVIDER", "manual").toLowerCase();
const host = required(config, "STAGING_HOST");
const domains = [
  required(config, "STAGING_WEB_DOMAIN"),
  required(config, "STAGING_API_DOMAIN"),
  required(config, "STAGING_GRAFANA_DOMAIN"),
];

if (isIP(host) !== 4) {
  throw new Error("STAGING_HOST deve ser um endereco IPv4 para registros A");
}

if (!apply || provider === "manual") {
  console.log("Registros DNS A necessarios:");
  domains.forEach((domain) => console.log(`- ${domain} -> ${host}`));

  if (!apply) {
    console.log("Use --apply para configurar ou validar a propagacao.");
    process.exit(0);
  }
}

if (provider === "cloudflare") {
  const zoneId = required(config, "CLOUDFLARE_ZONE_ID");
  const apiToken = required(config, "CLOUDFLARE_API_TOKEN");
  const proxied =
    optional(config, "DNS_PROXIED", "false").toLowerCase() === "true";

  for (const domain of domains) {
    await upsertCloudflareRecord({
      apiToken,
      domain,
      host,
      proxied,
      zoneId,
    });
  }
} else if (provider !== "manual") {
  throw new Error(`DNS_PROVIDER nao suportado: ${provider}`);
}

await waitForPropagation(domains, host, provider === "cloudflare" &&
  optional(config, "DNS_PROXIED", "false").toLowerCase() === "true");

async function upsertCloudflareRecord({
  apiToken,
  domain,
  host,
  proxied,
  zoneId,
}) {
  const baseUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`;
  const headers = {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/json",
  };
  const listUrl = new URL(baseUrl);

  listUrl.searchParams.set("type", "A");
  listUrl.searchParams.set("name", domain);

  const list = await cloudflareRequest(listUrl, { headers });
  const existing = list.result?.[0];
  const body = JSON.stringify({
    comment: "PaoBom hosted staging",
    content: host,
    name: domain,
    proxied,
    ttl: 1,
    type: "A",
  });

  if (existing) {
    await cloudflareRequest(`${baseUrl}/${existing.id}`, {
      body,
      headers,
      method: "PUT",
    });
    console.log(`DNS atualizado: ${domain}`);
    return;
  }

  await cloudflareRequest(baseUrl, {
    body,
    headers,
    method: "POST",
  });
  console.log(`DNS criado: ${domain}`);
}

async function cloudflareRequest(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.success === false) {
    const message =
      payload.errors?.map((error) => error.message).join(", ") ||
      `HTTP ${response.status}`;
    throw new Error(`Cloudflare DNS falhou: ${message}`);
  }

  return payload;
}

async function waitForPropagation(domains, expectedIp, proxied) {
  const deadline = Date.now() + 10 * 60_000;

  while (Date.now() < deadline) {
    const results = await Promise.all(
      domains.map(async (domain) => {
        try {
          return { addresses: await resolve4(domain), domain };
        } catch {
          return { addresses: [], domain };
        }
      }),
    );
    const ready = results.every(({ addresses }) =>
      proxied ? addresses.length > 0 : addresses.includes(expectedIp),
    );

    if (ready) {
      results.forEach(({ addresses, domain }) =>
        console.log(`DNS propagado: ${domain} -> ${addresses.join(", ")}`),
      );
      return;
    }

    await new Promise((resolveDelay) => setTimeout(resolveDelay, 10_000));
  }

  throw new Error("Tempo excedido aguardando propagacao DNS");
}
