#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { DEFAULT_MANIFEST_PATH } from "./release-manifest.mjs";

export function packageReleaseTag(record) {
  const packageName = record.name.slice("@lapismd/".length);
  return `${packageName}@${record.version}`;
}

function runGh(args, { allowFailure = false } = {}) {
  const result = spawnSync("gh", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && !allowFailure) {
    throw new Error(`gh ${args.join(" ")} failed:\n${result.stderr}`);
  }
  return result;
}

function encodedTag(tag) {
  return tag.split("/").map(encodeURIComponent).join("/");
}

function ensureTag(repository, tag, commit) {
  const refPath = `repos/${repository}/git/ref/tags/${encodedTag(tag)}`;
  const existing = runGh(["api", refPath], { allowFailure: true });
  if (existing.status === 0) {
    const ref = JSON.parse(existing.stdout);
    if (ref.object?.type !== "commit" || ref.object?.sha !== commit) {
      throw new Error(`${tag}: existing tag does not target ${commit}`);
    }
    return;
  }
  if (!/404|Not Found/i.test(existing.stderr)) {
    throw new Error(
      `${tag}: could not inspect existing tag\n${existing.stderr}`,
    );
  }
  runGh([
    "api",
    "--method",
    "POST",
    `repos/${repository}/git/refs`,
    "-f",
    `ref=refs/tags/${tag}`,
    "-f",
    `sha=${commit}`,
  ]);
}

function ensureRelease(repository, record, tag) {
  const releasePath = `repos/${repository}/releases/tags/${encodedTag(tag)}`;
  const existing = runGh(["api", releasePath], { allowFailure: true });
  if (existing.status === 0) {
    const release = JSON.parse(existing.stdout);
    if (release.body?.trim() !== record.changelog.trim()) {
      throw new Error(`${tag}: existing GitHub release notes differ`);
    }
    return;
  }
  if (!/404|Not Found/i.test(existing.stderr)) {
    throw new Error(
      `${tag}: could not inspect existing GitHub release\n${existing.stderr}`,
    );
  }
  runGh([
    "api",
    "--method",
    "POST",
    `repos/${repository}/releases`,
    "-f",
    `tag_name=${tag}`,
    "-f",
    `target_commitish=${record.commit}`,
    "-f",
    `name=${record.name} ${record.version}`,
    "-f",
    `body=${record.changelog}`,
  ]);
}

function main() {
  const manifestPath = path.resolve(process.argv[2] ?? DEFAULT_MANIFEST_PATH);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const repository = process.env.GITHUB_REPOSITORY;
  if (!process.env.GITHUB_TOKEN || repository !== "lapismd/mira-mde") {
    throw new Error(
      "GitHub release creation requires lapismd/mira-mde CI credentials",
    );
  }
  if (!process.env.GITHUB_SHA || process.env.GITHUB_SHA !== manifest.commit) {
    throw new Error(
      "GitHub release commit does not match the verified manifest",
    );
  }
  for (const packageRecord of manifest.packages) {
    const record = { ...packageRecord, commit: manifest.commit };
    const tag = packageReleaseTag(record);
    ensureTag(repository, tag, manifest.commit);
    ensureRelease(repository, record, tag);
    console.log(`Verified GitHub release ${tag}.`);
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
      `GitHub release creation failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }
}
