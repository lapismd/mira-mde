import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

test("js-yaml audit overrides stay on their requested major lines", () => {
  const workspace = readFileSync(
    path.join(repoRoot, "pnpm-workspace.yaml"),
    "utf8",
  );
  assert.match(workspace, /js-yaml@3:\s*">=3\.15\.2 <4"/);
  assert.match(workspace, /js-yaml@4:\s*">=4\.3\.2 <5"/);
  assert.doesNotMatch(workspace, /js-yaml@[^:\n]+:\s*">=[^"<\n]+"/);

  const lockfile = readFileSync(path.join(repoRoot, "pnpm-lock.yaml"), "utf8");
  assert.match(
    lockfile,
    /read-yaml-file@1\.1\.0:\n\s+dependencies:\n(?:\s+[^\n]+\n)*?\s+js-yaml: 3\./,
  );
});

test("Changesets can read the workspace YAML with the installed js-yaml", () => {
  const result = spawnSync("pnpm", ["exec", "changeset", "status"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  const output = `${result.stdout}\n${result.stderr}`;
  assert.doesNotMatch(output, /yaml\.safeLoad is not a function/);
  assert.equal(result.status, 0, output);
});
