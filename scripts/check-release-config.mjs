#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  DEFAULT_REPO_ROOT,
  PUBLIC_PACKAGE_GRAPH,
  readPublicPackages,
} from "./public-packages.mjs";
import { syncEditorVersion } from "./sync-release-versions.mjs";

export function validateReleaseConfiguration(repoRoot = DEFAULT_REPO_ROOT) {
  const errors = [];
  const configPath = path.join(repoRoot, ".changeset/config.json");
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  if (config.access !== "public")
    errors.push("Changesets access must be public");
  if (config.baseBranch !== "main")
    errors.push("Changesets baseBranch must be main");
  if (config.updateInternalDependencies !== "patch") {
    errors.push("Changesets must update internal dependencies at patch level");
  }
  if (config.fixed?.length !== 0 || config.linked?.length !== 0) {
    errors.push("Public packages must not use fixed or linked versions");
  }
  if (
    config.privatePackages?.version !== false ||
    config.privatePackages?.tag !== false
  ) {
    errors.push("Changesets must not version or tag private packages");
  }
  if (existsSync(path.join(repoRoot, ".changeset/pre.json"))) {
    errors.push("Prerelease mode is not supported");
  }

  const seen = new Set();
  for (const definition of PUBLIC_PACKAGE_GRAPH) {
    for (const dependency of definition.dependencies) {
      if (!seen.has(dependency)) {
        errors.push(
          `${definition.name}: ${dependency} must appear earlier in the graph`,
        );
      }
    }
    seen.add(definition.name);
  }

  for (const record of readPublicPackages(repoRoot)) {
    const changelog = path.join(record.directory, "CHANGELOG.md");
    if (!existsSync(changelog)) {
      errors.push(`${record.name}: missing CHANGELOG.md`);
      continue;
    }
    const source = readFileSync(changelog, "utf8");
    if (!source.includes(`## ${record.manifest.version}`)) {
      errors.push(
        `${record.name}: CHANGELOG.md has no ${record.manifest.version} entry`,
      );
    }
  }

  try {
    const result = syncEditorVersion({ repoRoot });
    if (!result.synchronized) {
      errors.push(
        `MIRA_EDITOR_VERSION ${result.currentVersion} does not match ${result.manifestVersion}`,
      );
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  return { ok: errors.length === 0, errors };
}

function main() {
  const result = validateReleaseConfiguration();
  if (!result.ok) {
    console.error("Mira release configuration failed:");
    for (const error of result.errors) console.error(`  - ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    "Mira release configuration validated for six independent packages.",
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  main();
}
