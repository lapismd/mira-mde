import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  reviewedAuditSource,
  runDevelopmentAudit,
} from "./development-audit.mjs";

test("source delegates to actual immutable shared CLI with build scripts disabled", () => {
  let call;
  const status = runDevelopmentAudit({
    root: "/source",
    env: {
      GITHUB_REPOSITORY: "unexpected/fork",
      LAPIS_AUDIT_POLICY_FILE: "untrusted.json",
    },
    run: (...args) => {
      call = args;
      return { status: 1 };
    },
  });
  assert.equal(status, 1);
  assert.equal(reviewedAuditSource, "63e64958e9b271d36feba06a162ee02b079a3206");
  assert.deepEqual(call[1], [
    "--config.ignore-scripts=true",
    `--package=github:lapismd/lapis-ci#${reviewedAuditSource}`,
    "dlx",
    "lapis-development-audit",
  ]);
  assert.equal(call[2].cwd, "/source");
  assert.equal(
    call[2].env.GITHUB_REPOSITORY,
    "unexpected/fork",
    "caller context must not be forged by the adapter",
  );
  assert.equal(call[2].env.GITHUB_WORKSPACE, "/source");
  assert.equal(
    call[2].env.LAPIS_AUDIT_POLICY_FILE,
    ".github/development-audit-policy.json",
  );
  assert.equal(
    call[2].env.LAPIS_AUDIT_REPORT_DIRECTORY,
    ".release/development-audit",
  );
});
test("source policy contains no active or inferred approval", () =>
  assert.deepEqual(
    JSON.parse(
      readFileSync(
        new URL("../.github/development-audit-policy.json", import.meta.url),
      ),
    ),
    { schemaVersion: 2, repository: "lapismd/mira-mde", approvals: [] },
  ));
for (const result of [
  { status: 0 },
  { status: 1 },
  { status: 2 },
  { status: null, signal: "SIGTERM" },
  { status: 0, error: new Error("unavailable") },
])
  test(`preserves failure and never bypasses shared decisions: ${result.status}/${result.signal ?? "none"}`, () =>
    assert.equal(
      runDevelopmentAudit({ run: () => result }),
      result.status === 0 && !result.error ? 0 : 1,
    ));
test("normal check, CI and release use the same mandatory source audit lane", () => {
  const manifest = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url)),
  );
  assert.deepEqual(manifest.repository, {
    type: "git",
    url: "git+https://github.com/lapismd/mira-mde.git",
  });
  const lanes = JSON.parse(
    readFileSync(new URL("./validation/lanes.json", import.meta.url)),
  );
  assert.equal(lanes.audit, "node scripts/development-audit.mjs");
  assert.match(lanes.check, /^pnpm run audit && /);
  for (const file of ["mira-spec-first.yml", "release.yml"]) {
    const text = readFileSync(
      new URL("../.github/workflows/" + file, import.meta.url),
      "utf8",
    );
    assert.match(text, /pnpm run audit/);
    assert.match(text, /Retain raw development audit/);
    assert.match(text, /\.release\/development-audit/);
  }
});
