#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_REPO_ROOT = path.resolve(SCRIPT_DIR, "..");

export const PUBLIC_PACKAGES = new Map([
  ["@lapismd/mira", new Set()],
  ["@lapismd/mira-plugin-ai", new Set(["@lapismd/mira"])],
  ["@lapismd/mira-plugin-mermaid", new Set(["@lapismd/mira"])],
  [
    "@lapismd/mira-editor",
    new Set(["@lapismd/mira", "@lapismd/mira-plugin-mermaid"]),
  ],
  [
    "@lapismd/mira-react",
    new Set([
      "@lapismd/mira",
      "@lapismd/mira-editor",
      "@lapismd/mira-plugin-mermaid",
    ]),
  ],
  ["@lapismd/mira-vanilla", new Set(["@lapismd/mira", "@lapismd/mira-editor"])],
]);

const TEXT_EXTENSIONS = new Set([
  ".css",
  ".d.ts",
  ".js",
  ".json",
  ".mjs",
  ".svelte",
  ".ts",
  ".tsx",
]);

const FORBIDDEN_PUBLIC_PATTERNS = [
  { pattern: /@mira-mde\//, label: "legacy @mira-mde import" },
  { pattern: /@mira-internal\//, label: "private adapter import" },
  {
    pattern: /@lapismd\/mira\/internal(?:\/|["'])/,
    label: "private Mira implementation import",
  },
  {
    pattern:
      /\b(?:MiraMde|MiraDefault\w*|createMiraMde|createMiraDefault\w*)\b/,
    label: "legacy public symbol",
  },
  {
    pattern: /mira-(?:mde|default-ui|default-toolbar)/,
    label: "legacy public CSS hook",
  },
];

function childDirectories(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(directory, entry.name));
}

function textFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", ".turbo"].includes(entry.name)) return [];
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return textFiles(absolutePath);
    if (!entry.isFile()) return [];
    if (/\.(?:spec|test)\.[cm]?[jt]sx?$/.test(entry.name)) return [];
    return TEXT_EXTENSIONS.has(path.extname(entry.name)) ||
      entry.name.endsWith(".d.ts")
      ? [absolutePath]
      : [];
  });
}

function readManifest(directory) {
  const manifestPath = path.join(directory, "package.json");
  if (!existsSync(manifestPath)) return null;
  return JSON.parse(readFileSync(manifestPath, "utf8"));
}

function inspectPublicText(repoRoot, packageDirectory, errors) {
  for (const sourceDirectory of ["src", "dist"]) {
    for (const file of textFiles(
      path.join(packageDirectory, sourceDirectory),
    )) {
      const source = readFileSync(file, "utf8");
      const relativePath = path.relative(repoRoot, file).replaceAll("\\", "/");
      for (const forbidden of FORBIDDEN_PUBLIC_PATTERNS) {
        if (forbidden.pattern.test(source)) {
          errors.push(`${relativePath}: ${forbidden.label}`);
        }
      }
    }
  }
}

export function validatePackageBoundaries({
  repoRoot = DEFAULT_REPO_ROOT,
} = {}) {
  const errors = [];
  const packageDirectories = childDirectories(path.join(repoRoot, "packages"));
  const publicNames = new Set();

  for (const packageDirectory of packageDirectories) {
    const manifest = readManifest(packageDirectory);
    if (!manifest) continue;
    const relativeDirectory = path
      .relative(repoRoot, packageDirectory)
      .replaceAll("\\", "/");
    const allowedDependencies = PUBLIC_PACKAGES.get(manifest.name);

    if (!allowedDependencies) {
      errors.push(
        `${relativeDirectory}: unapproved public package ${manifest.name}`,
      );
      continue;
    }
    publicNames.add(manifest.name);

    if (manifest.private === true)
      errors.push(`${manifest.name}: approved public package is private`);
    if (manifest.version !== "0.0.1")
      errors.push(`${manifest.name}: version must be 0.0.1`);
    for (const field of [
      "description",
      "license",
      "repository",
      "files",
      "exports",
    ]) {
      if (!manifest[field]) errors.push(`${manifest.name}: missing ${field}`);
    }
    if (!("sideEffects" in manifest))
      errors.push(`${manifest.name}: missing sideEffects`);
    if (manifest.publishConfig?.access !== "public")
      errors.push(`${manifest.name}: publishConfig.access must be public`);

    const exportedTargets = JSON.stringify(manifest.exports ?? {});
    if (/dist\/internal(?:\/|["'])/.test(exportedTargets))
      errors.push(`${manifest.name}: export map exposes src/internal output`);
    if (manifest.exports?.["./svelte"])
      errors.push(`${manifest.name}: legacy /svelte export is not supported`);

    const runtimeDependencies = {
      ...manifest.dependencies,
      ...manifest.optionalDependencies,
    };
    for (const dependencyName of Object.keys(runtimeDependencies)) {
      if (
        dependencyName.startsWith("@lapismd/mira") &&
        !allowedDependencies.has(dependencyName)
      ) {
        errors.push(
          `${manifest.name}: invalid public dependency on ${dependencyName}`,
        );
      }
    }

    inspectPublicText(repoRoot, packageDirectory, errors);
  }

  for (const packageName of PUBLIC_PACKAGES.keys()) {
    if (!publicNames.has(packageName))
      errors.push(`Missing approved public package: ${packageName}`);
  }

  const adapterDirectories = childDirectories(
    path.join(repoRoot, "internal", "adapters"),
  );
  for (const adapterDirectory of adapterDirectories) {
    const manifest = readManifest(adapterDirectory);
    if (!manifest) continue;
    const relativeDirectory = path
      .relative(repoRoot, adapterDirectory)
      .replaceAll("\\", "/");
    if (manifest.private !== true)
      errors.push(`${relativeDirectory}: internal adapter must be private`);
    if (!manifest.name?.startsWith("@mira-internal/"))
      errors.push(`${relativeDirectory}: invalid internal adapter name`);
  }

  return {
    ok: errors.length === 0,
    errors,
    stats: {
      publicPackages: publicNames.size,
      internalAdapters: adapterDirectories.length,
    },
  };
}

function main() {
  const result = validatePackageBoundaries();
  if (!result.ok) {
    console.error("Mira package-boundary validation failed:");
    for (const error of result.errors) console.error(`  - ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    `Mira package boundaries validated: ${result.stats.publicPackages} public packages, ${result.stats.internalAdapters} private adapters.`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
)
  main();
