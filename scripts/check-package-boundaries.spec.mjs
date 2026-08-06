import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  PUBLIC_PACKAGES,
  validatePackageBoundaries,
} from "./check-package-boundaries.mjs";

function createFixture(mutate) {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), "mira-packages-"));
  for (const [packageName, dependencies] of PUBLIC_PACKAGES) {
    const directory = packageName.slice("@lapismd/".length);
    const packageDirectory = path.join(repoRoot, "packages", directory);
    mkdirSync(path.join(packageDirectory, "src"), { recursive: true });
    writeFileSync(
      path.join(packageDirectory, "package.json"),
      `${JSON.stringify(
        {
          name: packageName,
          version: "0.0.1",
          description: `${packageName} fixture`,
          license: "AGPL-3.0-or-later",
          repository: { type: "git", url: "git+https://example.test/mira.git" },
          files: ["CHANGELOG.md", "dist"],
          exports: { ".": "./dist/index.js" },
          sideEffects: false,
          dependencies: Object.fromEntries(
            [...dependencies].map((dependency) => [dependency, "workspace:~"]),
          ),
          publishConfig: { access: "public" },
        },
        null,
        2,
      )}\n`,
    );
    writeFileSync(
      path.join(packageDirectory, "src", "index.ts"),
      "export {};\n",
    );
    writeFileSync(
      path.join(packageDirectory, "CHANGELOG.md"),
      `# ${packageName}\n`,
    );
  }
  const adapterDirectory = path.join(repoRoot, "internal/adapters/vue");
  mkdirSync(adapterDirectory, { recursive: true });
  writeFileSync(
    path.join(adapterDirectory, "package.json"),
    '{"name":"@mira-internal/vue","private":true}\n',
  );
  mutate?.(repoRoot);
  return repoRoot;
}

function withFixture(mutate, assertion) {
  const repoRoot = createFixture(mutate);
  try {
    assertion(validatePackageBoundaries({ repoRoot }));
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
}

test("accepts the six-package public graph and private adapters", () => {
  withFixture(undefined, (result) => {
    assert.equal(result.ok, true);
    assert.equal(result.stats.publicPackages, 6);
    assert.equal(result.stats.internalAdapters, 1);
  });
});

test("accepts independent stable versions after the first release", () => {
  withFixture(
    (repoRoot) => {
      const manifestPath = path.join(repoRoot, "packages/mira/package.json");
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      manifest.version = "0.3.2";
      writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`);
    },
    (result) => {
      assert.equal(result.ok, true);
    },
  );
});

test("rejects unapproved packages and dependency direction", () => {
  withFixture(
    (repoRoot) => {
      const extra = path.join(repoRoot, "packages/extra");
      mkdirSync(extra, { recursive: true });
      writeFileSync(extra + "/package.json", '{"name":"@lapismd/extra"}\n');

      const miraManifest = path.join(repoRoot, "packages/mira/package.json");
      const manifest = JSON.parse(readFileSync(miraManifest, "utf8"));
      manifest.dependencies["@lapismd/mira-editor"] = "workspace:*";
      writeFileSync(miraManifest, `${JSON.stringify(manifest)}\n`);
    },
    (result) => {
      assert.equal(result.ok, false);
      assert.match(result.errors.join("\n"), /unapproved public package/);
      assert.match(result.errors.join("\n"), /invalid public dependency/);
    },
  );
});

test("rejects legacy names and internal implementation exports", () => {
  withFixture(
    (repoRoot) => {
      const packageDirectory = path.join(repoRoot, "packages/mira");
      const manifestPath = path.join(packageDirectory, "package.json");
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      manifest.exports["./internal"] = "./dist/internal/index.js";
      writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`);
      writeFileSync(
        path.join(packageDirectory, "src/index.ts"),
        'export { MiraMde } from "@mira-mde/svelte";\n',
      );
    },
    (result) => {
      assert.equal(result.ok, false);
      assert.match(result.errors.join("\n"), /src\/internal/);
      assert.match(result.errors.join("\n"), /legacy @mira-mde import/);
      assert.match(result.errors.join("\n"), /legacy public symbol/);
    },
  );
});

test("rejects prereleases and broad public workspace ranges", () => {
  withFixture(
    (repoRoot) => {
      const manifestPath = path.join(
        repoRoot,
        "packages/mira-editor/package.json",
      );
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      manifest.version = "0.1.0-next.1";
      manifest.dependencies["@lapismd/mira"] = "workspace:*";
      writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`);
    },
    (result) => {
      assert.equal(result.ok, false);
      assert.match(result.errors.join("\n"), /stable Semantic Version/);
      assert.match(result.errors.join("\n"), /must use workspace:~/);
    },
  );
});
