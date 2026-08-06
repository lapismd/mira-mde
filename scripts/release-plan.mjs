#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import semver from "semver";

import {
  DEFAULT_REPO_ROOT,
  isStableVersion,
  readPublicPackages,
} from "./public-packages.mjs";

export const DEFAULT_REGISTRY = "https://registry.npmjs.org";
export const DEFAULT_PLAN_PATH = path.join(
  DEFAULT_REPO_ROOT,
  ".release/release-plan.json",
);

function normalizeVersions(value) {
  if (typeof value === "string") return [value];
  return Array.isArray(value) ? value : [];
}

export function planReleaseCandidates(
  packageRecords,
  registryVersions,
  repoRoot = DEFAULT_REPO_ROOT,
) {
  const selected = [];
  const skipped = [];

  for (const [order, record] of packageRecords.entries()) {
    const { manifest, name, directory } = record;
    if (manifest.name !== name) {
      throw new Error(`${directory}: expected package name ${name}`);
    }
    if (!isStableVersion(manifest.version)) {
      throw new Error(`${name}: ${manifest.version} is not a stable version`);
    }

    const versions = normalizeVersions(registryVersions.get(name));
    const stableRegistryVersions = versions.filter(isStableVersion);
    const latest = stableRegistryVersions.sort(semver.rcompare)[0] ?? null;
    if (latest && semver.gt(latest, manifest.version)) {
      throw new Error(
        `${name}: local version ${manifest.version} is behind npm ${latest}`,
      );
    }

    const candidate = {
      name,
      version: manifest.version,
      directory: path.relative(repoRoot, directory).replaceAll("\\", "/"),
      order,
      registryEmpty: versions.length === 0,
    };
    if (versions.includes(manifest.version)) {
      skipped.push({ ...candidate, reason: "exact-version-published" });
    } else {
      selected.push(candidate);
    }
  }

  return { selected, skipped };
}

function run(command, args, cwd = DEFAULT_REPO_ROOT) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) throw result.error;
  return result;
}

export function resolveReleaseCommit() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  const result = run("jj", [
    "--no-pager",
    "log",
    "-r",
    "@",
    "--no-graph",
    "-T",
    "commit_id",
  ]);
  if (result.status !== 0 || !result.stdout.trim()) {
    throw new Error(
      "GITHUB_SHA is unset and the current Jujutsu commit could not be resolved",
    );
  }
  return result.stdout.trim();
}

export function readNpmVersions(
  packageName,
  { registry = DEFAULT_REGISTRY } = {},
) {
  const result = run("npm", [
    "view",
    packageName,
    "versions",
    "--json",
    "--registry",
    registry,
  ]);
  if (result.status !== 0) {
    const details = `${result.stdout}\n${result.stderr}`;
    if (/\bE404\b|404 Not Found/i.test(details)) return [];
    throw new Error(`npm view failed for ${packageName}: ${details.trim()}`);
  }
  if (!result.stdout.trim()) return [];
  return normalizeVersions(JSON.parse(result.stdout));
}

export function createReleasePlan({
  repoRoot = DEFAULT_REPO_ROOT,
  registry = DEFAULT_REGISTRY,
  commit = resolveReleaseCommit(),
  getVersions = (name) => readNpmVersions(name, { registry }),
} = {}) {
  const packages = readPublicPackages(repoRoot);
  const versions = new Map(
    packages.map(({ name }) => [name, getVersions(name)]),
  );
  const { selected, skipped } = planReleaseCandidates(
    packages,
    versions,
    repoRoot,
  );
  return {
    schemaVersion: 1,
    commit,
    registry,
    createdAt: new Date().toISOString(),
    bootstrapRequired: selected.some(({ registryEmpty }) => registryEmpty),
    selected,
    skipped,
  };
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--output") options.output = argv[++index];
    else if (argument === "--registry") options.registry = argv[++index];
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(
      "Usage: node scripts/release-plan.mjs [--output path] [--registry url]",
    );
    return;
  }
  const output = path.resolve(options.output ?? DEFAULT_PLAN_PATH);
  const plan = createReleasePlan({ registry: options.registry });
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(plan, null, 2)}\n`);
  console.log(
    `Release plan selected ${plan.selected.length} package(s) and skipped ${plan.skipped.length}: ${output}`,
  );
  for (const candidate of plan.selected) {
    console.log(`  publish ${candidate.name}@${candidate.version}`);
  }
  for (const candidate of plan.skipped) {
    console.log(`  skip ${candidate.name}@${candidate.version}`);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    main();
  } catch (error) {
    console.error(
      `Release planning failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }
}
