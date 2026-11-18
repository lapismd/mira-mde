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
test("source policy binds only the exact explicit-user HIGH picomatch approvals", () => {
  const policy = JSON.parse(
    readFileSync(
      new URL("../.github/development-audit-policy.json", import.meta.url),
    ),
  );
  assert.equal(policy.schemaVersion, 2);
  assert.equal(policy.repository, "lapismd/mira-mde");
  assert.equal(policy.approvals.length, 2);
  for (const entry of policy.approvals) {
    assert.equal(entry.advisory, "GHSA-fc5q-39xc-vjpf");
    assert.equal(entry.package, "picomatch");
    assert.equal(entry.severity, "high");
    assert.equal(entry.scope, "development-only");
    assert.equal(entry.vulnerableRange, "<=4.0.7");
    assert.equal(entry.patchedRange, "<0.0.0");
    assert.equal(entry.sourceSha, "efd6eb0f6bb3dd90d314fc82e0fdb93ccd739b3c");
    assert.equal(
      entry.manifestSha256,
      "b5ee695f16d307bdf936f5faa529a36bcf8e8179970c3778ecd232327fd69799",
    );
    assert.equal(
      entry.lockSha256,
      "da5000188deea37ad19e01bc875ae9258bd632b402680fe4da8a5ac737523c71",
    );
    assert.equal(entry.approvedAt, "2026-11-18T13:30:52.633Z");
    assert.equal(entry.expiresAt, "2026-11-19T00:00:00.000Z");
    assert.equal(entry.authority, "explicit-user");
    assert.equal(
      entry.record,
      "spec/records/2026-11-18-development-high-decision.md",
    );
  }
  assert.deepEqual(
    policy.approvals.map(({ version, path }) => ({ version, path })),
    [
      {
        version: "4.0.7",
        path: ".>@changesets/cli>@changesets/config>picomatch",
      },
      {
        version: "4.0.5",
        path: ".>@changesets/cli>@changesets/git>picomatch",
      },
    ],
  );
});
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
