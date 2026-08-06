#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { DEFAULT_REPO_ROOT, readPublicPackages } from "./public-packages.mjs";
import {
  changelogEntry,
  DEFAULT_MANIFEST_PATH,
  RELEASE_MANIFEST_SCHEMA,
  sha512Integrity,
  validateReleaseManifest,
} from "./release-manifest.mjs";
import { DEFAULT_PLAN_PATH, resolveReleaseCommit } from "./release-plan.mjs";

function run(command, args, cwd = DEFAULT_REPO_ROOT) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed:\n${result.stdout}${result.stderr}`,
    );
  }
  return result.stdout;
}

function inspectPackedManifest(tarball) {
  return JSON.parse(run("tar", ["-xOf", tarball, "package/package.json"]));
}

export function prepareRelease({
  repoRoot = DEFAULT_REPO_ROOT,
  planPath = DEFAULT_PLAN_PATH,
  manifestPath = DEFAULT_MANIFEST_PATH,
  commit = resolveReleaseCommit(),
} = {}) {
  const plan = JSON.parse(readFileSync(planPath, "utf8"));
  if (plan.schemaVersion !== 1)
    throw new Error("Unsupported release plan schema");
  if (plan.commit !== commit) {
    throw new Error(
      `Release plan commit ${plan.commit} does not match ${commit}`,
    );
  }
  const bootstrapRequired = plan.selected.some(
    ({ registryEmpty }) => registryEmpty === true,
  );
  if (plan.bootstrapRequired !== bootstrapRequired) {
    throw new Error("Release plan bootstrap state is inconsistent");
  }

  const releaseRoot = path.dirname(manifestPath);
  const tarballRoot = path.join(releaseRoot, "tarballs");
  rmSync(tarballRoot, { recursive: true, force: true });
  mkdirSync(tarballRoot, { recursive: true });

  const localPackages = new Map(
    readPublicPackages(repoRoot).map((record) => [record.name, record]),
  );
  const packages = [];
  for (const candidate of plan.selected) {
    const local = localPackages.get(candidate.name);
    if (!local || local.manifest.version !== candidate.version) {
      throw new Error(
        `${candidate.name}: release plan no longer matches the workspace`,
      );
    }

    const before = new Set(readdirSync(tarballRoot));
    run("pnpm", ["pack", "--pack-destination", tarballRoot], local.directory);
    const filename = readdirSync(tarballRoot).find(
      (entry) => !before.has(entry),
    );
    if (!filename)
      throw new Error(`${candidate.name}: pnpm pack produced no tarball`);

    const absoluteTarball = path.join(tarballRoot, filename);
    const packed = inspectPackedManifest(absoluteTarball);
    if (
      packed.name !== candidate.name ||
      packed.version !== candidate.version
    ) {
      throw new Error(`${candidate.name}: packed manifest identity mismatch`);
    }
    const packedDependencies = {
      ...packed.dependencies,
      ...packed.optionalDependencies,
    };
    for (const [name, range] of Object.entries(packedDependencies)) {
      if (String(range).startsWith("workspace:")) {
        throw new Error(`${candidate.name}: packed ${name} retained ${range}`);
      }
    }

    const changelogPath = path.join(local.directory, "CHANGELOG.md");
    const changelog = changelogEntry(
      readFileSync(changelogPath, "utf8"),
      candidate.version,
    );
    if (!changelog) {
      throw new Error(
        `${candidate.name}: no changelog entry for ${candidate.version}`,
      );
    }
    packages.push({
      ...candidate,
      tarball: `tarballs/${filename}`,
      integrity: sha512Integrity(absoluteTarball),
      changelogPath: path
        .relative(repoRoot, changelogPath)
        .replaceAll("\\", "/"),
      changelog,
    });
  }

  const manifest = {
    schemaVersion: RELEASE_MANIFEST_SCHEMA,
    commit,
    registry: plan.registry,
    createdAt: new Date().toISOString(),
    bootstrapRequired,
    packages,
  };
  const validation = validateReleaseManifest({
    manifest,
    releaseRoot,
    repoRoot,
    expectedCommit: commit,
  });
  if (!validation.ok) throw new Error(validation.errors.join("\n"));
  mkdirSync(releaseRoot, { recursive: true });
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--plan") options.planPath = path.resolve(argv[++index]);
    else if (argument === "--output") {
      options.manifestPath = path.resolve(argv[++index]);
    } else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(
      "Usage: node scripts/prepare-release.mjs [--plan path] [--output path]",
    );
    return;
  }
  const manifest = prepareRelease(options);
  console.log(
    `Prepared ${manifest.packages.length} immutable release tarball(s).`,
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
      `Release preparation failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }
}
