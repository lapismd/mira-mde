import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  DEFAULT_REPO_ROOT,
  PUBLIC_PACKAGE_GRAPH,
  readPublicPackages,
} from "./public-packages.mjs";

export const RELEASE_MANIFEST_SCHEMA = 1;
export const DEFAULT_RELEASE_ROOT = path.join(DEFAULT_REPO_ROOT, ".release");
export const DEFAULT_MANIFEST_PATH = path.join(
  DEFAULT_RELEASE_ROOT,
  "release-manifest.json",
);

export function sha512Integrity(file) {
  const digest = createHash("sha512")
    .update(readFileSync(file))
    .digest("base64");
  return `sha512-${digest}`;
}

export function changelogEntry(source, version) {
  const heading = `## ${version}`;
  const start = source.indexOf(heading);
  if (start === -1) return null;
  const next = source.indexOf("\n## ", start + heading.length);
  return source.slice(start, next === -1 ? undefined : next).trim();
}

function artifactPath(releaseRoot, relativePath) {
  if (
    typeof relativePath !== "string" ||
    path.isAbsolute(relativePath) ||
    !relativePath.startsWith("tarballs/")
  ) {
    return null;
  }
  const resolved = path.resolve(releaseRoot, relativePath);
  if (!resolved.startsWith(`${path.resolve(releaseRoot)}${path.sep}`))
    return null;
  return resolved;
}

export function validateReleaseManifest({
  manifest,
  releaseRoot = DEFAULT_RELEASE_ROOT,
  repoRoot = DEFAULT_REPO_ROOT,
  expectedCommit,
  requireTarballs = true,
} = {}) {
  const errors = [];
  if (manifest?.schemaVersion !== RELEASE_MANIFEST_SCHEMA) {
    errors.push(`release manifest schema must be ${RELEASE_MANIFEST_SCHEMA}`);
  }
  if (
    !manifest?.commit ||
    (expectedCommit && manifest.commit !== expectedCommit)
  ) {
    errors.push(
      `release manifest commit must be ${expectedCommit ?? "present"}`,
    );
  }
  if (typeof manifest?.bootstrapRequired !== "boolean") {
    errors.push("release manifest bootstrapRequired must be boolean");
  }
  if (!Array.isArray(manifest?.packages)) {
    errors.push("release manifest packages must be an array");
    return { ok: false, errors };
  }

  const localPackages = new Map(
    readPublicPackages(repoRoot).map((record) => [record.name, record]),
  );
  const graphOrder = new Map(
    PUBLIC_PACKAGE_GRAPH.map(({ name }, index) => [name, index]),
  );
  const names = new Set();
  let previousOrder = -1;
  for (const record of manifest.packages) {
    if (names.has(record.name))
      errors.push(`${record.name}: duplicate package`);
    names.add(record.name);

    const expectedOrder = graphOrder.get(record.name);
    if (expectedOrder === undefined) {
      errors.push(`${record.name}: not in the public package graph`);
    } else if (
      record.order !== expectedOrder ||
      record.order <= previousOrder
    ) {
      errors.push(`${record.name}: invalid publication order ${record.order}`);
    }
    previousOrder = record.order;

    const local = localPackages.get(record.name);
    if (!local || local.manifest.version !== record.version) {
      errors.push(
        `${record.name}: manifest version does not match the workspace`,
      );
    }
    if (manifest.bootstrapRequired && record.version !== "0.0.1") {
      errors.push(`${record.name}: bootstrap releases must be version 0.0.1`);
    }
    if (!record.changelog?.startsWith(`## ${record.version}`)) {
      errors.push(`${record.name}: missing exact changelog entry`);
    }

    const tarball = artifactPath(releaseRoot, record.tarball);
    if (!tarball) {
      errors.push(`${record.name}: invalid tarball path`);
    } else if (requireTarballs && !existsSync(tarball)) {
      errors.push(`${record.name}: missing tarball ${record.tarball}`);
    } else if (
      requireTarballs &&
      sha512Integrity(tarball) !== record.integrity
    ) {
      errors.push(`${record.name}: tarball integrity mismatch`);
    }
  }

  return { ok: errors.length === 0, errors };
}
