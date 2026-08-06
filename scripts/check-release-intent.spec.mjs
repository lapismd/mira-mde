import assert from "node:assert/strict";
import test from "node:test";

import { validateReleaseIntent } from "./check-release-intent.mjs";

test("requires release intent for public runtime changes", () => {
  const result = validateReleaseIntent(["packages/mira/src/index.ts"]);
  assert.equal(result.ok, false);
  assert.deepEqual(result.publicChanges, ["packages/mira/src/index.ts"]);
});

test("accepts a version-bearing or explicit empty Changeset file", () => {
  const result = validateReleaseIntent([
    "packages/mira-editor/package.json",
    ".changeset/quiet-editors-smile.md",
  ]);
  assert.equal(result.ok, true);
  assert.deepEqual(result.changesets, [".changeset/quiet-editors-smile.md"]);
});

test("ignores changelog, test-only, and private-root changes", () => {
  const result = validateReleaseIntent([
    "packages/mira/CHANGELOG.md",
    "packages/mira/src/controller.test.ts",
    "scripts/release-plan.mjs",
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.publicChanges.length, 0);
});
