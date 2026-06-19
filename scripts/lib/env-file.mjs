import { readFile } from "node:fs/promises";

export async function readEnvironmentFile(path) {
  return {
    ...parseEnvironment(await readFile(path, "utf8")),
    ...Object.fromEntries(
      Object.entries(process.env).filter(([, value]) => value !== undefined),
    ),
  };
}

export function parseEnvironment(contents) {
  const values = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");

    if (separator < 1) {
      throw new Error(`Linha de ambiente invalida: ${line}`);
    }

    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();

    values[key] = stripQuotes(rawValue);
  }

  return values;
}

export function required(environment, name) {
  const value = environment[name]?.trim();

  if (!value) {
    throw new Error(`Variavel obrigatoria ausente: ${name}`);
  }

  return value;
}

export function optional(environment, name, fallback = "") {
  return environment[name]?.trim() || fallback;
}

export function serializeEnvironment(entries) {
  return `${Object.entries(entries)
    .map(([key, value]) => `${key}=${String(value).replace(/\r?\n/g, "\\n")}`)
    .join("\n")}\n`;
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
