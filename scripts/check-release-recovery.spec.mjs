import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  validateRecoveryPublication,
  verifyRecoveryArchive,
} from "./check-release-recovery.mjs";

const source = "a".repeat(40);
const bytes = Buffer.from("original immutable artifact");
const digest = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
const original = {
  source,
  runId: "123",
  artifactId: "456",
  run: {
    id: 123,
    head_sha: "b".repeat(40),
    repository: { full_name: "lapismd/mira-mde" },
    path: ".github/workflows/release.yml",
    event: "workflow_dispatch",
    head_branch: "main",
    status: "completed",
  },
  jobs: [
    { name: "Build verified release artifact", conclusion: "success" },
    { name: "Publish with npm trusted publishing", conclusion: "success" },
  ],
  artifact: {
    id: 456,
    workflow_run: { id: 123 },
    expired: false,
    name: `mira-release-${source}`,
    digest,
  },
};

test("accepts a successful publisher even when later verification failed", () => {
  assert.equal(
    validateRecoveryPublication({
      ...original,
      run: { ...original.run, conclusion: "failure" },
    }).source,
    source,
  );
  verifyRecoveryArchive(bytes, digest);
});
test("rejects wrong repositories, workflows, branches, events, IDs and unfinished releases", () => {
  for (const patch of [
    { id: 999 },
    { repository: { full_name: "other/mira-mde" } },
    { path: ".github/workflows/other.yml" },
    { head_branch: "feature" },
    { event: "push" },
    { status: "in_progress" },
  ])
    assert.throws(() =>
      validateRecoveryPublication({
        ...original,
        run: { ...original.run, ...patch },
      }),
    );
  for (const patch of [
    { source: "main" },
    { runId: "123/../../other" },
    { artifactId: "latest" },
  ])
    assert.throws(() => validateRecoveryPublication({ ...original, ...patch }));
});
test("rejects absent, failed and ambiguous publication gates", () => {
  for (const jobs of [
    [],
    original.jobs.slice(0, 1),
    [...original.jobs, { ...original.jobs[1] }],
    original.jobs.map((job) => ({ ...job, conclusion: "failure" })),
  ])
    assert.throws(() => validateRecoveryPublication({ ...original, jobs }));
});
test("rejects replaced, expired, wrong-source and wrong-run artifacts", () => {
  for (const patch of [
    { id: 999 },
    { workflow_run: { id: 999 } },
    { expired: true },
    { name: "mira-release-wrong" },
    { digest: undefined },
  ])
    assert.throws(() =>
      validateRecoveryPublication({
        ...original,
        artifact: { ...original.artifact, ...patch },
      }),
    );
  assert.throws(
    () => verifyRecoveryArchive(Buffer.from("replacement"), digest),
    /digest mismatch/,
  );
});
test("verification recovery has no publication capability or OIDC credential", () => {
  const workflow = readFileSync(
    ".github/workflows/verify-published-release.yml",
    "utf8",
  );
  assert.doesNotMatch(
    workflow,
    /id-token:|release:publish|npm publish|NODE_AUTH_TOKEN|NPM_TOKEN|publish:\s*true/,
  );
  assert.match(workflow, /node scripts\/check-release-recovery\.mjs/);
  assert(
    workflow.indexOf("pnpm release:verify") <
      workflow.indexOf("pnpm release:notes"),
  );
});
