import assert from "node:assert/strict";
import test from "node:test";

import {
  classifySpecFirstChanges,
  parseUnifiedDiff,
} from "./check-spec-first.mjs";

test("requires the exact plugin chapter", () => {
  const missing = classifySpecFirstChanges([
    "packages/plugin-ai/src/index.ts",
    "spec/src/plugins/mermaid.md",
  ]);
  assert.equal(missing.ok, false);
  assert.deepEqual(missing.missingChapters, ["spec/src/plugins/ai.md"]);

  const covered = classifySpecFirstChanges([
    "packages/plugin-ai/src/index.ts",
    "spec/src/plugins/ai.md",
  ]);
  assert.equal(covered.ok, true);
});

test("requires every chapter for a cross-boundary change", () => {
  const result = classifySpecFirstChanges([
    "packages/core/src/index.ts",
    "packages/default-ui/src/default-mde.svelte",
    "spec/src/editor-and-markdown.md",
  ]);
  assert.equal(result.ok, false);
  assert.deepEqual(result.missingChapters, [
    "spec/src/default-ui-and-frameworks.md",
  ]);
});

test("ignores tests, ordinary stories, fixtures, and generated output", () => {
  const result = classifySpecFirstChanges([
    "packages/core/src/index.test.ts",
    "stories/markdown/fixtures.ts",
    "stories/markdown/links/Links.stories.ts",
    "spec/book/index.html",
    "tests/visual/result.diff.png",
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.requiresSpec, false);
});

test("protects Storybook catalog metadata and governance", () => {
  const result = classifySpecFirstChanges([
    "stories/catalog/components.ts",
    ".storybook/main.ts",
    "scripts/check-catalog.mjs",
    "scripts/check-spec-first.mjs",
  ]);
  assert.equal(result.ok, false);
  assert.deepEqual(result.missingChapters, [
    "spec/src/spec-governance.md",
    "spec/src/storybook-catalog.md",
  ]);
});

test("fails closed for unmapped production source", () => {
  const result = classifySpecFirstChanges([
    "packages/new-package/src/index.ts",
  ]);
  assert.equal(result.ok, false);
  assert.deepEqual(result.unmappedProductionFiles, [
    "packages/new-package/src/index.ts",
  ]);
});

test("parses unified diffs and both sides of a rename", () => {
  const changes =
    parseUnifiedDiff(`diff --git a/packages/plugin-ai/src/index.ts b/tests/index.ts
similarity index 100%
rename from packages/plugin-ai/src/index.ts
rename to tests/index.ts
`);
  const result = classifySpecFirstChanges(changes);
  assert.equal(result.ok, false);
  assert.deepEqual(result.protectedFiles, ["packages/plugin-ai/src/index.ts"]);
});

test("rejects unparseable non-empty change output", () => {
  assert.throws(
    () => parseUnifiedDiff("Modified regular file package.json\n"),
    /no unified diff headers/,
  );
});
