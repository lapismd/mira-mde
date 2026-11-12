import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveApprovedReleaseSource,
  validateSelectedRelease,
} from "./check-release-source.mjs";
const head = "b".repeat(40),
  ancestor = "a".repeat(40);
const options = {
  workflowCommit: head,
  requestedSource: ancestor,
  packageVersions: '["@lapismd/mira@0.1.5"]',
  event: "workflow_dispatch",
  ref: "refs/heads/main",
  isAncestor: () => true,
};
test("current-main preparation retains the existing unfiltered plan", () => {
  assert.deepEqual(
    resolveApprovedReleaseSource({
      ...options,
      requestedSource: "",
      packageVersions: "",
      event: "push",
    }),
    { commit: head, versions: null },
  );
});
test("an approved historical source requires an exact main ancestor and package set", () => {
  assert.deepEqual(resolveApprovedReleaseSource(options), {
    commit: ancestor,
    versions: ["@lapismd/mira@0.1.5"],
  });
});
test("source requests reject mutable refs, unrelated commits and non-main/non-manual execution", () => {
  for (const patch of [
    { requestedSource: "main" },
    { isAncestor: () => false },
    { ref: "refs/heads/feature" },
    { event: "push" },
  ])
    assert.throws(() => resolveApprovedReleaseSource({ ...options, ...patch }));
});
test("historical requests reject absent, duplicate and malformed package versions", () => {
  for (const packageVersions of [
    "",
    "[]",
    '["@lapismd/mira@0.1.5","@lapismd/mira@0.1.5"]',
    '["@lapismd/mira@latest"]',
    '"@lapismd/mira@0.1.5"',
  ])
    assert.throws(() =>
      resolveApprovedReleaseSource({ ...options, packageVersions }),
    );
});
test("selected artifacts must exactly match the requested source and version set", () => {
  const plan = {
    commit: ancestor,
    selected: [{ name: "@lapismd/mira", version: "0.1.5" }],
  };
  assert.doesNotThrow(() =>
    validateSelectedRelease(plan, ancestor, ["@lapismd/mira@0.1.5"]),
  );
  for (const wrong of [
    { ...plan, commit: head },
    { ...plan, selected: [{ name: "@lapismd/mira", version: "0.2.0" }] },
    {
      ...plan,
      selected: [
        ...plan.selected,
        { name: "@lapismd/mira-editor", version: "0.0.4" },
      ],
    },
    { ...plan, selected: [] },
  ])
    assert.throws(() =>
      validateSelectedRelease(wrong, ancestor, ["@lapismd/mira@0.1.5"]),
    );
});
