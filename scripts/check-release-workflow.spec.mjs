import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  checkReleaseWorkflows,
  validateReleaseWorkflows,
} from "./check-release-workflow.mjs";

test("accepts the repository release and CI workflows", () => {
  assert.deepEqual(checkReleaseWorkflows(), { ok: true, errors: [] });
});

test("rejects token credentials in production and direct publication", () => {
  const releaseSource = readFileSync(".github/workflows/release.yml", "utf8")
    .replace('MIRA_RELEASE_APPROVED: "1"', "NODE_AUTH_TOKEN: unsafe")
    .replace(
      "run: pnpm release:publish .release/release-manifest.json",
      "run: npm publish",
    );
  const ciSource = readFileSync(
    ".github/workflows/mira-spec-first.yml",
    "utf8",
  );
  const result = validateReleaseWorkflows({ releaseSource, ciSource });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /token credentials/);
  assert.match(result.errors.join("\n"), /release:publish/);
});

test("rejects CI without explicit release intent", () => {
  const releaseSource = readFileSync(".github/workflows/release.yml", "utf8");
  const ciSource = readFileSync(
    ".github/workflows/mira-spec-first.yml",
    "utf8",
  ).replace("pnpm release:intent", "pnpm omitted:intent");
  const result = validateReleaseWorkflows({ releaseSource, ciSource });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /release:intent/);
});
