import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";

type LogLevel = "error" | "info" | "warn";

type MetricLabels = {
  method: string;
  route: string;
  status: number;
};

const durationBuckets = [0.05, 0.1, 0.25, 0.5, 0.8, 1, 2, 5];
const requestCounters = new Map<string, number>();
const durationHistograms = new Map<
  string,
  { bucketCounts: number[]; count: number; sum: number }
>();
let activeRequests = 0;
let databaseReady = 0;

export function getRequestId(req: IncomingMessage) {
  const forwardedId = req.headers["x-request-id"];

  if (typeof forwardedId === "string" && forwardedId.trim()) {
    return forwardedId.trim().slice(0, 128);
  }

  return randomUUID();
}

export function beginRequest() {
  activeRequests += 1;
  return process.hrtime.bigint();
}

export function finishRequest(
  startedAt: bigint,
  labels: MetricLabels,
) {
  activeRequests = Math.max(0, activeRequests - 1);
  const durationSeconds =
    Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;
  const normalized = {
    method: normalizeLabel(labels.method),
    route: normalizeLabel(labels.route),
    status: labels.status,
  };
  const counterKey = JSON.stringify(normalized);
  const histogramKey = JSON.stringify({
    method: normalized.method,
    route: normalized.route,
  });
  const histogram = durationHistograms.get(histogramKey) ?? {
    bucketCounts: durationBuckets.map(() => 0),
    count: 0,
    sum: 0,
  };

  requestCounters.set(counterKey, (requestCounters.get(counterKey) ?? 0) + 1);
  histogram.count += 1;
  histogram.sum += durationSeconds;
  durationBuckets.forEach((bucket, index) => {
    if (durationSeconds <= bucket) {
      histogram.bucketCounts[index] += 1;
    }
  });
  durationHistograms.set(histogramKey, histogram);

  return durationSeconds;
}

export function setDatabaseReady(ready: boolean) {
  databaseReady = ready ? 1 : 0;
}

export function renderMetrics() {
  const lines = [
    "# HELP paobom_api_info Informacoes da API PaoBom.",
    "# TYPE paobom_api_info gauge",
    'paobom_api_info{service="paobom-api"} 1',
    "# HELP paobom_api_uptime_seconds Tempo de atividade do processo.",
    "# TYPE paobom_api_uptime_seconds gauge",
    `paobom_api_uptime_seconds ${process.uptime()}`,
    "# HELP paobom_api_active_requests Requisicoes HTTP em andamento.",
    "# TYPE paobom_api_active_requests gauge",
    `paobom_api_active_requests ${activeRequests}`,
    "# HELP paobom_database_ready Estado da conexao com PostgreSQL.",
    "# TYPE paobom_database_ready gauge",
    `paobom_database_ready ${databaseReady}`,
    "# HELP paobom_api_memory_bytes Memoria utilizada pelo processo Node.js.",
    "# TYPE paobom_api_memory_bytes gauge",
    `paobom_api_memory_bytes{type="rss"} ${process.memoryUsage().rss}`,
    `paobom_api_memory_bytes{type="heap_used"} ${process.memoryUsage().heapUsed}`,
    "# HELP paobom_http_requests_total Total de requisicoes HTTP.",
    "# TYPE paobom_http_requests_total counter",
  ];

  for (const [key, value] of requestCounters) {
    const labels = JSON.parse(key) as MetricLabels;
    lines.push(
      `paobom_http_requests_total${formatLabels(labels)} ${value}`,
    );
  }

  lines.push(
    "# HELP paobom_http_request_duration_seconds Duracao das requisicoes HTTP.",
    "# TYPE paobom_http_request_duration_seconds histogram",
  );

  for (const [key, histogram] of durationHistograms) {
    const labels = JSON.parse(key) as Omit<MetricLabels, "status">;

    durationBuckets.forEach((bucket, index) => {
      lines.push(
        `paobom_http_request_duration_seconds_bucket${formatLabels({
          ...labels,
          le: bucket,
        })} ${histogram.bucketCounts[index]}`,
      );
    });
    lines.push(
      `paobom_http_request_duration_seconds_bucket${formatLabels({
        ...labels,
        le: "+Inf",
      })} ${histogram.count}`,
    );
    lines.push(
      `paobom_http_request_duration_seconds_sum${formatLabels(labels)} ${histogram.sum}`,
    );
    lines.push(
      `paobom_http_request_duration_seconds_count${formatLabels(labels)} ${histogram.count}`,
    );
  }

  return `${lines.join("\n")}\n`;
}

export function logEvent(
  level: LogLevel,
  event: string,
  fields: Record<string, unknown> = {},
) {
  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    service: "paobom-api",
    environment: process.env.APP_ENV ?? process.env.NODE_ENV ?? "development",
    ...fields,
  });

  if (level === "error") {
    console.error(payload);
    return;
  }

  if (level === "warn") {
    console.warn(payload);
    return;
  }

  console.log(payload);
}

function normalizeLabel(value: string) {
  return value.replace(/[\r\n"]/g, "_").slice(0, 160);
}

function formatLabels(labels: Record<string, string | number>) {
  const entries = Object.entries(labels).map(
    ([key, value]) => `${key}="${normalizeLabel(String(value))}"`,
  );

  return `{${entries.join(",")}}`;
}
