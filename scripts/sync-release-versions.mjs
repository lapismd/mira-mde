#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { DEFAULT_REPO_ROOT, isStableVersion } from "./public-packages.mjs";

const VERSION_PATTERN = /(export const MIRA_EDITOR_VERSION = ")[^"]+(";)/;

export function syncEditorVersion({
  repoRoot = DEFAULT_REPO_ROOT,
  write = false,
} = {}) {
  const manifest = JSON.parse(
    readFileSync(
      path.join(repoRoot, "packages/mira-editor/package.json"),
      "utf8",
    ),
  );
  if (!isStableVersion(manifest.version)) {
    throw new Error(
      `@lapismd/mira-editor version is not stable: ${manifest.version}`,
    );
  }

  const versionPath = path.join(
    repoRoot,
    "packages/mira-editor/src/version.ts",
  );
  const source = readFileSync(versionPath, "utf8");
  const match = source.match(VERSION_PATTERN);
  if (!match) throw new Error("Could not locate MIRA_EDITOR_VERSION");

  const currentVersion = match[0].slice(match[1].length, -match[2].length);
  const synchronized = currentVersion === manifest.version;
  if (!synchronized && write) {
    writeFileSync(
      versionPath,
      source.replace(VERSION_PATTERN, `$1${manifest.version}$2`),
    );
  }

  return {
    currentVersion,
    manifestVersion: manifest.version,
    synchronized: synchronized || write,
    changed: !synchronized && write,
  };
}

function main() {
  const write = process.argv.includes("--write");
  const check = process.argv.includes("--check");
  if (write === check) {
    throw new Error("Pass exactly one of --check or --write");
  }

  const result = syncEditorVersion({ write });
  if (!result.synchronized) {
    console.error(
      `MIRA_EDITOR_VERSION ${result.currentVersion} does not match package version ${result.manifestVersion}.`,
    );
    process.exitCode = 1;
    return;
  }
  console.log(
    result.changed
      ? `Synchronized MIRA_EDITOR_VERSION to ${result.manifestVersion}.`
      : `MIRA_EDITOR_VERSION is synchronized at ${result.manifestVersion}.`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  main();
}
