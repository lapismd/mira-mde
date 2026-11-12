#!/usr/bin/env node
import { createHash } from "node:crypto";
import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

export function validateRecoveryPublication({
  run,
  jobs,
  artifact,
  source,
  runId,
  artifactId,
}) {
  if (!/^[a-f0-9]{40}$/.test(source ?? ""))
    throw new Error("Recovery source must be immutable");
  if (
    !/^[1-9]\d*$/.test(String(runId)) ||
    !/^[1-9]\d*$/.test(String(artifactId))
  )
    throw new Error("Recovery requires exact run and artifact IDs");
  if (
    String(run?.id) !== String(runId) ||
    run.repository?.full_name !== "lapismd/mira-mde" ||
    run.path !== ".github/workflows/release.yml" ||
    run.event !== "workflow_dispatch" ||
    run.head_branch !== "main" ||
    run.status !== "completed" ||
    !/^[a-f0-9]{40}$/.test(run.head_sha ?? "")
  )
    throw new Error(
      "Recovery requires a completed manual main release in the canonical repository",
    );
  for (const name of [
    "Build verified release artifact",
    "Publish with npm trusted publishing",
  ]) {
    const matches = jobs.filter((job) => job.name === name);
    if (matches.length !== 1 || matches[0].conclusion !== "success")
      throw new Error(`Original ${name} job must have succeeded`);
  }
  if (
    String(artifact?.id) !== String(artifactId) ||
    String(artifact.workflow_run?.id) !== String(runId) ||
    artifact.expired !== false ||
    artifact.name !== `mira-release-${source}` ||
    !/^sha256:[a-f0-9]{64}$/.test(artifact.digest ?? "")
  )
    throw new Error(
      "Recovery artifact must match the original publication run and exact source, with an available ZIP digest",
    );
  return {
    source,
    runId: String(runId),
    artifactId: String(artifactId),
    digest: artifact.digest,
  };
}

export function verifyRecoveryArchive(bytes, digest) {
  if (`sha256:${createHash("sha256").update(bytes).digest("hex")}` !== digest)
    throw new Error("Original publication ZIP digest mismatch");
}

async function main() {
  if (
    process.env.GITHUB_REPOSITORY !== "lapismd/mira-mde" ||
    process.env.GITHUB_EVENT_NAME !== "workflow_dispatch" ||
    process.env.GITHUB_REF !== "refs/heads/main"
  )
    throw new Error(
      "Verification recovery must be manually dispatched on canonical main",
    );
  const source = process.env.MIRA_RECOVERY_SOURCE;
  const runId = process.env.MIRA_RECOVERY_RUN;
  const artifactId = process.env.MIRA_RECOVERY_ARTIFACT;
  if (
    !/^[a-f0-9]{40}$/.test(source ?? "") ||
    !/^[1-9]\d*$/.test(runId ?? "") ||
    !/^[1-9]\d*$/.test(artifactId ?? "")
  )
    throw new Error("Invalid immutable recovery inputs");
  if (
    spawnSync(
      "git",
      ["merge-base", "--is-ancestor", source, process.env.GITHUB_SHA],
      { stdio: "ignore" },
    ).status !== 0
  )
    throw new Error("Recovery source must already be merged into current main");
  const headers = {
    Authorization: `Bearer ${process.env.GH_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const get = async (route) => {
    const response = await fetch(
      `https://api.github.com/repos/lapismd/mira-mde/${route}`,
      { headers },
    );
    if (!response.ok)
      throw new Error(
        `GitHub recovery read failed: ${response.status} ${route}`,
      );
    return response;
  };
  const run = await (await get(`actions/runs/${runId}`)).json();
  const jobs = [];
  for (let page = 1; ; page++) {
    const result = await (
      await get(`actions/runs/${runId}/jobs?per_page=100&page=${page}`)
    ).json();
    jobs.push(...result.jobs);
    if (result.jobs.length < 100) break;
  }
  const artifact = await (await get(`actions/artifacts/${artifactId}`)).json();
  const receipt = validateRecoveryPublication({
    run,
    jobs,
    artifact,
    source,
    runId,
    artifactId,
  });
  const bytes = Buffer.from(
    await (await get(`actions/artifacts/${artifactId}/zip`)).arrayBuffer(),
  );
  verifyRecoveryArchive(bytes, receipt.digest);
  mkdirSync(".release", { recursive: true });
  writeFileSync(".release/original-publication.zip", bytes);
  const listing = spawnSync(
    "unzip",
    ["-Z1", ".release/original-publication.zip"],
    { encoding: "utf8" },
  );
  if (
    listing.status !== 0 ||
    listing.stdout
      .split(/\r?\n/)
      .some(
        (file) =>
          file.startsWith("/") ||
          file.includes("\\") ||
          file.split("/").includes(".."),
      )
  )
    throw new Error("Unsafe publication artifact paths");
  const extract = spawnSync(
    "unzip",
    ["-q", ".release/original-publication.zip", "-d", ".release/original"],
    { stdio: "inherit" },
  );
  if (extract.status !== 0)
    throw new Error("Could not extract original artifact");
  const manifest = JSON.parse(
    readFileSync(".release/original/release-manifest.json", "utf8"),
  );
  if (
    manifest.commit !== source ||
    manifest.registry !== "https://registry.npmjs.org" ||
    !manifest.packages?.length
  )
    throw new Error(
      "Original manifest must match the selected source and public registry",
    );
  writeFileSync(
    ".release/recovery-source.json",
    `${JSON.stringify({ ...receipt, workflowSource: run.head_sha, recoverySource: process.env.GITHUB_SHA }, null, 2)}\n`,
  );
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `source=${source}\nworkflow_source=${run.head_sha}\n`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
