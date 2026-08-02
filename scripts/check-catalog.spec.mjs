import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { validateCatalog } from "./check-catalog.mjs";

function fixture(css = ".surface { color: var(--mira-foreground); }\n") {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), "mira-catalog-"));
  const cssPath = path.join(repoRoot, "packages/example/src/styles.css");
  mkdirSync(path.dirname(cssPath), { recursive: true });
  writeFileSync(cssPath, css);
  return repoRoot;
}

const validRegistry = {
  tokens: [
    {
      name: "--mira-foreground",
      purpose: "Text color.",
      defaultValue: "black",
      inherits: true,
      affects: "Text.",
    },
  ],
  entries: [
    {
      id: "example",
      name: "Example",
      packageName: "example",
      importPath: "example",
      description: "Example surface.",
      spec: "styling.md",
      components: ["Example"],
      tokens: ["--mira-foreground"],
      publicSurface: true,
    },
  ],
};

function verify(css, registry, assertion) {
  const repoRoot = fixture(css);
  try {
    assertion(validateCatalog({ repoRoot, registry, publicSurfaces: [] }));
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
}

test("accepts documented and assigned shipped Mira tokens", () => {
  verify(undefined, validRegistry, (result) => {
    assert.equal(result.ok, true);
    assert.equal(result.stats.tokens, 1);
  });
});

test("rejects undocumented and stale tokens", () => {
  verify(
    ".surface { color: var(--mira-new-token); }\n",
    validRegistry,
    (result) => {
      assert.equal(result.ok, false);
      assert.match(result.errors.join("\n"), /Undocumented shipped token/);
      assert.match(result.errors.join("\n"), /Stale catalog token/);
    },
  );
});

test("rejects unassigned tokens and incomplete entry metadata", () => {
  const registry = structuredClone(validRegistry);
  registry.entries[0].tokens = [];
  registry.entries[0].description = "";
  verify(undefined, registry, (result) => {
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /missing description/);
    assert.match(result.errors.join("\n"), /Unassigned public token/);
  });
});
