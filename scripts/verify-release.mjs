#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  closeSync,
  mkdtempSync,
  mkdirSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  DEFAULT_MANIFEST_PATH,
  validateReleaseManifest,
} from "./release-manifest.mjs";
import { publishedIntegrity } from "./publish-release.mjs";
import { resolveReleaseCommit } from "./release-plan.mjs";
import { verifyNpmProvenance } from "./verify-npm-provenance.mjs";

export function runVerificationCommand(command, args, cwd) {
  const directory = mkdtempSync(path.join(os.tmpdir(), "mira-verify-output-"));
  const stdoutPath = path.join(directory, "stdout");
  const stderrPath = path.join(directory, "stderr");
  let stdout;
  let stderr;
  try {
    stdout = openSync(stdoutPath, "w");
    stderr = openSync(stderrPath, "w");
    const result = spawnSync(command, args, {
      cwd,
      stdio: ["ignore", stdout, stderr],
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(
        `${command} ${args.join(" ")} failed:\n${readFileSync(stdoutPath, "utf8")}${readFileSync(stderrPath, "utf8")}`,
      );
    }
    return readFileSync(stdoutPath, "utf8");
  } finally {
    if (stdout !== undefined) closeSync(stdout);
    if (stderr !== undefined) closeSync(stderr);
    rmSync(directory, { recursive: true, force: true });
  }
}

export function verifyRegistryIntegrity(manifest) {
  const errors = [];
  for (const record of manifest.packages) {
    const integrity = publishedIntegrity(record.name, record.version, {
      registry: manifest.registry,
    });
    if (integrity !== record.integrity) {
      errors.push(
        `${record.name}@${record.version}: registry integrity mismatch`,
      );
    }
  }
  return { ok: errors.length === 0, errors };
}

function main() {
  const manifestPath = path.resolve(process.argv[2] ?? DEFAULT_MANIFEST_PATH);
  const auditPath = path.resolve(
    process.argv[3] ??
      path.join(path.dirname(manifestPath), "npm-signatures.json"),
  );
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const validation = validateReleaseManifest({
    manifest,
    releaseRoot: path.dirname(manifestPath),
    expectedCommit: resolveReleaseCommit(),
  });
  if (!validation.ok) throw new Error(validation.errors.join("\n"));

  const integrity = verifyRegistryIntegrity(manifest);
  if (!integrity.ok) throw new Error(integrity.errors.join("\n"));

  const temporaryRoot = mkdtempSync(
    path.join(os.tmpdir(), "mira-release-verify-"),
  );
  try {
    writeFileSync(
      path.join(temporaryRoot, "package.json"),
      `${JSON.stringify({ name: "mira-release-verification", private: true })}\n`,
    );
    runVerificationCommand(
      "npm",
      [
        "install",
        "--ignore-scripts",
        "--package-lock=true",
        `--registry=${manifest.registry}`,
        ...manifest.packages.map(({ name, version }) => `${name}@${version}`),
      ],
      temporaryRoot,
    );
    for (const record of manifest.packages) {
      const installedManifest = JSON.parse(
        readFileSync(
          path.join(temporaryRoot, "node_modules", record.name, "package.json"),
          "utf8",
        ),
      );
      if (installedManifest.version !== record.version) {
        throw new Error(
          `${record.name}: clean install resolved the wrong version`,
        );
      }
    }

    const audit = runVerificationCommand(
      "npm",
      ["audit", "signatures", "--json", "--include-attestations"],
      temporaryRoot,
    );
    mkdirSync(path.dirname(auditPath), { recursive: true });
    writeFileSync(auditPath, audit);
    const provenance = verifyNpmProvenance(
      JSON.parse(audit),
      manifest.packages,
      {
        workflowCommit: process.env.MIRA_PROVENANCE_WORKFLOW_SOURCE,
        runId: process.env.MIRA_PROVENANCE_RUN_ID,
      },
    );
    if (!provenance.ok) throw new Error(provenance.errors.join("\n"));
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
  console.log(
    `Verified clean installation, integrity, and provenance for ${manifest.packages.length} package(s).`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    main();
  } catch (error) {
    console.error(
      `Post-publish verification failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }
}
