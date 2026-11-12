#!/usr/bin/env node
import { appendFileSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export function resolveApprovedReleaseSource({
  workflowCommit,
  requestedSource = "",
  packageVersions = "",
  event,
  ref,
  isAncestor,
}) {
  if (!/^[a-f0-9]{40}$/.test(workflowCommit ?? ""))
    throw new Error("Workflow source must be an immutable commit");
  if (ref !== "refs/heads/main")
    throw new Error("Release dispatches must run from main");
  const commit = requestedSource || workflowCommit;
  if (!/^[a-f0-9]{40}$/.test(commit))
    throw new Error("Requested source must be an immutable commit");
  let versions = null;
  if (packageVersions.trim()) {
    versions = JSON.parse(packageVersions);
    if (
      !Array.isArray(versions) ||
      !versions.length ||
      versions.some(
        (version) =>
          typeof version !== "string" ||
          !/^@[a-z0-9][\w.-]*\/[a-z0-9][\w.-]*@\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(
            version,
          ),
      ) ||
      new Set(versions).size !== versions.length
    )
      throw new Error(
        "Expected package versions must be a nonempty unique array of exact scoped versions",
      );
    versions = [...versions].sort();
  }
  if (requestedSource) {
    if (event !== "workflow_dispatch")
      throw new Error("Historical sources require an explicit manual dispatch");
    if (!versions)
      throw new Error(
        "Historical sources require an exact package-version selection",
      );
    if (!isAncestor(commit, workflowCommit))
      throw new Error("Requested source must already be merged into main");
  }
  return { commit, versions };
}

export function validateSelectedRelease(plan, commit, versions) {
  if (plan.commit !== commit)
    throw new Error(
      "Release plan source differs from the selected immutable source",
    );
  if (!Array.isArray(plan.selected))
    throw new Error("Release plan has no selected package collection");
  const actual = plan.selected
    .map(({ name, version }) => `${name}@${version}`)
    .sort();
  if (
    versions &&
    JSON.stringify(actual) !== JSON.stringify([...versions].sort())
  )
    throw new Error(
      `Release selection differs: expected ${JSON.stringify(versions)}, received ${JSON.stringify(actual)}`,
    );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (process.argv[2] === "source") {
    const result = resolveApprovedReleaseSource({
      workflowCommit: process.env.GITHUB_SHA,
      requestedSource: process.env.MIRA_REQUESTED_SOURCE,
      packageVersions: process.env.MIRA_EXPECTED_VERSIONS,
      event: process.env.GITHUB_EVENT_NAME,
      ref: process.env.GITHUB_REF,
      isAncestor: (source, head) =>
        spawnSync("git", ["merge-base", "--is-ancestor", source, head], {
          stdio: "ignore",
        }).status === 0,
    });
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `commit=${result.commit}\nversions=${JSON.stringify(result.versions)}\n`,
    );
  } else if (process.argv[2] === "selection") {
    validateSelectedRelease(
      JSON.parse(readFileSync(process.argv[3], "utf8")),
      process.env.MIRA_RELEASE_SOURCE,
      JSON.parse(process.env.MIRA_RELEASE_EXPECTED_VERSIONS),
    );
  } else throw new Error("Use source or selection <release-plan.json>");
}
