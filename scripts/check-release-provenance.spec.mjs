import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { resolveReleaseCommit } from "./release-plan.mjs";
import { publicationEnv } from "./publish-release.mjs";
import { PUBLIC_PACKAGE_GRAPH } from "./public-packages.mjs";

test("package source approval leaves the OIDC workflow identity intact", () => {
  const source = "a".repeat(40),
    workflow = "b".repeat(40);
  const env = { GITHUB_SHA: workflow, MIRA_RELEASE_SOURCE: source };
  assert.equal(resolveReleaseCommit(env), source);
  assert.equal(publicationEnv(env).GITHUB_SHA, workflow);
  assert.deepEqual(env, { GITHUB_SHA: workflow, MIRA_RELEASE_SOURCE: source });
});
test("a selected package source must remain immutable", () => {
  assert.throws(
    () =>
      resolveReleaseCommit({
        GITHUB_SHA: "b".repeat(40),
        MIRA_RELEASE_SOURCE: "main",
      }),
    /immutable/,
  );
});
test("reviewed tooling validates versions from the selected product checkout", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "mira-selected-source-"));
  try {
    for (const { name, directory } of PUBLIC_PACKAGE_GRAPH) {
      const dir = path.join(root, "packages", directory);
      mkdirSync(dir, { recursive: true });
      writeFileSync(
        path.join(dir, "package.json"),
        JSON.stringify({ name, version: "0.1.5" }),
      );
    }
    const module = JSON.stringify(
      pathToFileURL(path.resolve("scripts/public-packages.mjs")).href,
    );
    const result = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `import {readPublicPackages} from ${module}; console.log(JSON.stringify(readPublicPackages().map(({manifest})=>manifest.version)))`,
      ],
      {
        encoding: "utf8",
        env: { ...process.env, MIRA_RELEASE_SOURCE_ROOT: root },
      },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(
      JSON.parse(result.stdout),
      PUBLIC_PACKAGE_GRAPH.map(() => "0.1.5"),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
