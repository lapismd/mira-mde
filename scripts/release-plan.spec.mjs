import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { planReleaseCandidates } from "./release-plan.mjs";

function record(name, version, order = 0) {
  return {
    name,
    directory: path.join("/repo/packages", name.split("/").at(-1)),
    dependencies: [],
    manifest: { name, version },
    order,
  };
}

test("selects only exact unpublished stable versions", () => {
  const packages = [
    record("@lapismd/mira", "0.0.2"),
    record("@lapismd/mira-editor", "0.1.0"),
  ];
  const versions = new Map([
    ["@lapismd/mira", ["0.0.1"]],
    ["@lapismd/mira-editor", ["0.1.0"]],
  ]);
  const result = planReleaseCandidates(packages, versions);
  assert.deepEqual(
    result.selected.map(({ name }) => name),
    ["@lapismd/mira"],
  );
  assert.equal(result.selected[0].registryEmpty, false);
  assert.deepEqual(
    result.skipped.map(({ name }) => name),
    ["@lapismd/mira-editor"],
  );
});

test("fails when any local version is behind npm", () => {
  assert.throws(
    () =>
      planReleaseCandidates(
        [record("@lapismd/mira", "0.0.1")],
        new Map([["@lapismd/mira", ["0.0.1", "0.0.2"]]]),
      ),
    /behind npm 0\.0\.2/,
  );
});

test("rejects prerelease candidates for the stable-only pipeline", () => {
  assert.throws(
    () =>
      planReleaseCandidates(
        [record("@lapismd/mira", "0.1.0-next.1")],
        new Map(),
      ),
    /not a stable version/,
  );
});
