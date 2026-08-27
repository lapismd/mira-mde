#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  DEFAULT_MANIFEST_PATH,
  validateReleaseManifest,
} from "./release-manifest.mjs";
import { DEFAULT_REGISTRY, resolveReleaseCommit } from "./release-plan.mjs";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) throw result.error;
  return result;
}

export function publishedIntegrity(
  packageName,
  version,
  { registry = DEFAULT_REGISTRY } = {},
) {
  const result = run("npm", [
    "view",
    `${packageName}@${version}`,
    "dist.integrity",
    "--json",
    "--registry",
    registry,
  ]);
  if (result.status !== 0) {
    const details = `${result.stdout}\n${result.stderr}`;
    if (/\bE404\b|404 Not Found/i.test(details)) return null;
    throw new Error(
      `npm integrity lookup failed for ${packageName}@${version}: ${details.trim()}`,
    );
  }
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}

export async function publishVerifiedPackages(
  manifest,
  { getIntegrity, publish, waitForIntegrity = getIntegrity },
) {
  const results = [];
  for (const record of manifest.packages) {
    const existing = await getIntegrity(record);
    if (existing) {
      if (existing !== record.integrity) {
        throw new Error(
          `${record.name}@${record.version} exists with different integrity`,
        );
      }
      results.push({ ...record, status: "already-published" });
      continue;
    }

    await publish(record);
    const published = await waitForIntegrity(record);
    if (published !== record.integrity) {
      throw new Error(
        `${record.name}@${record.version} did not resolve to the verified integrity`,
      );
    }
    results.push({ ...record, status: "published" });
  }
  return results;
}

function approvedEnvironment(manifest) {
  if (process.env.CI !== "true" || process.env.MIRA_RELEASE_APPROVED !== "1") {
    throw new Error(
      "Publishing requires an approved CI environment (MIRA_RELEASE_APPROVED=1)",
    );
  }
  if (manifest.bootstrapRequired === true) {
    throw new Error(
      "First publication is manual; publish the verified tarballs outside CI before enabling trusted publishing",
    );
  }
  if (
    !process.env.ACTIONS_ID_TOKEN_REQUEST_URL ||
    !process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN
  ) {
    throw new Error(
      "Trusted publication requires GitHub OIDC token permission",
    );
  }
}

async function waitForPublishedIntegrity(record, registry) {
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    const integrity = publishedIntegrity(record.name, record.version, {
      registry,
    });
    if (integrity) return integrity;
    if (attempt < 12) {
      await new Promise((resolve) => setTimeout(resolve, 10_000));
    }
  }
  return null;
}

async function main() {
  const manifestPath = path.resolve(process.argv[2] ?? DEFAULT_MANIFEST_PATH);
  const releaseRoot = path.dirname(manifestPath);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const commit = resolveReleaseCommit();
  const validation = validateReleaseManifest({
    manifest,
    releaseRoot,
    expectedCommit: commit,
  });
  if (!validation.ok) throw new Error(validation.errors.join("\n"));
  approvedEnvironment(manifest);

  const registry = manifest.registry ?? DEFAULT_REGISTRY;
  const results = await publishVerifiedPackages(manifest, {
    getIntegrity: ({ name, version }) =>
      publishedIntegrity(name, version, { registry }),
    publish: (record) => {
      const tarball = path.resolve(releaseRoot, record.tarball);
      const result = run("npm", [
        "publish",
        tarball,
        "--access",
        "public",
        "--tag",
        "latest",
        "--provenance",
        "--registry",
        registry,
      ]);
      if (result.status !== 0) {
        throw new Error(
          `npm publish failed for ${record.name}@${record.version}:\n${result.stdout}${result.stderr}`,
        );
      }
    },
    waitForIntegrity: (record) => waitForPublishedIntegrity(record, registry),
  });
  const resultPath = path.join(releaseRoot, "publish-result.json");
  writeFileSync(
    resultPath,
    `${JSON.stringify({ commit, registry, packages: results }, null, 2)}\n`,
  );
  console.log(`Published or verified ${results.length} package(s).`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  main().catch((error) => {
    console.error(
      `Release publication failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  });
}
