import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { PUBLIC_PACKAGE_GRAPH } from "./public-packages.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const require = createRequire(import.meta.url);
const cliRequire = createRequire(
  require.resolve("@changesets/cli/package.json"),
);
const packagesRequire = createRequire(
  cliRequire.resolve("@manypkg/get-packages"),
);
const toolsRequire = createRequire(packagesRequire.resolve("@manypkg/tools"));

test("js-yaml audit overrides retain major compatibility without vulnerable legacy tools", () => {
  const workspace = readFileSync(
    path.join(repoRoot, "pnpm-workspace.yaml"),
    "utf8",
  );
  assert.match(workspace, /js-yaml@3:\s*">=3\.15\.2 <4"/);
  assert.match(workspace, /js-yaml@4:\s*">=4\.3\.2 <5"/);
  assert.match(workspace, /js-yaml@>=5\.0\.0 <5\.4\.1:\s*">=5\.4\.1 <6"/);
  assert.doesNotMatch(workspace, /js-yaml@[^:\n]+:\s*">=[^"<\n]+"/);

  const lockfile = readFileSync(path.join(repoRoot, "pnpm-lock.yaml"), "utf8");
  assert.doesNotMatch(lockfile, /(?:braces|sprintf-js|read-yaml-file)@/);
});

test("Changesets workspace reader parses the actual pnpm graph with maintained YAML", async () => {
  const yaml = toolsRequire("yaml");
  const yamlVersion = toolsRequire("yaml/package.json").version;
  assert.match(yamlVersion, /^2\./);
  const workspace = yaml.parse(
    readFileSync(path.join(repoRoot, "pnpm-workspace.yaml"), "utf8"),
  );
  assert.deepEqual(workspace.packages, ["packages/*", "internal/adapters/*"]);
  const { getPackages } = cliRequire("@manypkg/get-packages");
  const graph = await getPackages(repoRoot);
  assert.equal(graph.tool.type, "pnpm");
  assert.deepEqual(
    graph.packages
      .filter((pkg) => !pkg.packageJson.private)
      .map((pkg) => pkg.packageJson.name)
      .sort(),
    PUBLIC_PACKAGE_GRAPH.map((pkg) => pkg.name).sort(),
  );
});

test("Changesets status produces the six-package release plan without a local base branch", () => {
  const directory = mkdtempSync(
    path.join(os.tmpdir(), "mira-changesets-status-"),
  );
  try {
    const output = path.join(directory, "plan.json");
    const result = spawnSync(
      process.execPath,
      [
        require.resolve("@changesets/cli/bin.js"),
        "status",
        `--output=${output}`,
      ],
      { cwd: repoRoot, encoding: "utf8" },
    );
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const plan = JSON.parse(readFileSync(output, "utf8"));
    assert.deepEqual(
      plan.releases.map((release) => release.name).sort(),
      PUBLIC_PACKAGE_GRAPH.map((pkg) => pkg.name).sort(),
    );
    assert.ok(plan.releases.every((release) => release.type === "patch"));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
