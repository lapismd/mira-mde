import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function loadChangesetsYamlReader() {
  const entries = readdirSync(path.join(repoRoot, "node_modules/.pnpm")).filter(
    (name) => name.startsWith("read-yaml-file@"),
  );
  assert.equal(
    entries.length,
    1,
    `expected one read-yaml-file install, found ${entries.join(", ")}`,
  );
  const pkgDir = path.join(
    repoRoot,
    "node_modules/.pnpm",
    entries[0],
    "node_modules/read-yaml-file",
  );
  const require = createRequire(path.join(pkgDir, "package.json"));
  return {
    readYamlFile: require(pkgDir),
    yaml: require("js-yaml"),
  };
}

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

test("Changesets YAML reader can parse the workspace with js-yaml 3", async () => {
  const { readYamlFile, yaml } = loadChangesetsYamlReader();
  assert.equal(typeof yaml.safeLoad, "function");
  const workspace = await readYamlFile(
    path.join(repoRoot, "pnpm-workspace.yaml"),
  );
  assert.deepEqual(workspace.packages, ["packages/*", "internal/adapters/*"]);
  assert.equal(workspace.overrides["js-yaml@3"], ">=3.15.2 <4");
  assert.equal(workspace.overrides["js-yaml@4"], ">=4.3.2 <5");
});
