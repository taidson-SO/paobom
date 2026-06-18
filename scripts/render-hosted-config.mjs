import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";

const argumentsMap = parseArguments(process.argv.slice(2));
const environmentFile = resolve(argumentsMap.env ?? ".env.hosted");
const outputDirectory = resolve(argumentsMap.output ?? ".runtime/staging");
const environment = parseEnvironment(await readFile(environmentFile, "utf8"));
const templates = [
  {
    source: "deploy/prometheus/prometheus.yml.tmpl",
    target: "prometheus.yml",
  },
  {
    source: "deploy/alertmanager/alertmanager.yml.tmpl",
    target: "alertmanager.yml",
  },
];

for (const template of templates) {
  const contents = await readFile(resolve(template.source), "utf8");
  const rendered = contents.replace(
    /\$\{([A-Z0-9_]+)\}/g,
    (_, variable) => requireVariable(environment, variable),
  );
  const target = resolve(outputDirectory, template.target);

  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, rendered, { mode: 0o644 });
  await chmod(target, 0o644);
}

console.log(`Configuracao hospedada renderizada em ${outputDirectory}`);

function parseArguments(values) {
  const result = {};

  for (let index = 0; index < values.length; index += 2) {
    const key = values[index]?.replace(/^--/, "");
    const value = values[index + 1];

    if (!key || !value) {
      throw new Error("Use --env <arquivo> e --output <diretorio>");
    }

    result[key] = value;
  }

  return result;
}

function parseEnvironment(contents) {
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

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function requireVariable(environment, variable) {
  const value = environment[variable];

  if (!value) {
    throw new Error(`Variavel obrigatoria ausente: ${variable}`);
  }

  return value;
}
