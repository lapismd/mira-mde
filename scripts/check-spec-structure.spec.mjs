import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { validateSpecStructure } from "./check-spec-structure.mjs";

function createFixture(overrides = {}) {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), "mira-spec-"));
  const files = {
    "packages/plugin-ai/package.json": '{"name":"@lapismd/mira-plugin-ai"}\n',
    "spec/book.toml": `[book]\nsrc = "src"\n\n[build]\nbuild-dir = "book"\n`,
    "spec/src/SUMMARY.md": `# Summary\n\n- [System](index.md)\n- [AI](plugins/ai.md)\n- [Verification](verification.md)\n`,
    "spec/src/index.md": `# System\n\n| ID | Requirement |\n| -- | -- |\n| MIRA-TEST-001 | The system MUST remain specified. |\n`,
    "spec/src/plugins/ai.md": `# AI\n\n\`@lapismd/mira-plugin-ai\`\n`,
    "spec/src/verification.md": `# Verification\n\nMIRA-TEST-001\n`,
    ...overrides,
  };
  for (const [relativePath, source] of Object.entries(files)) {
    const absolutePath = path.join(repoRoot, relativePath);
    if (source === null) {
      rmSync(absolutePath, { force: true });
      continue;
    }
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, source);
  }
  return repoRoot;
}

function withFixture(overrides, assertion) {
  const repoRoot = createFixture(overrides);
  try {
    assertion(validateSpecStructure({ repoRoot }));
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
}

test("accepts a complete specification with plugin coverage", () => {
  withFixture({}, (result) => {
    assert.equal(result.ok, true);
    assert.equal(result.stats.requirements, 1);
  });
});

test("rejects duplicate IDs, broken links, and unindexed chapters", () => {
  withFixture(
    {
      "spec/src/index.md": `# System\n\n[Missing](missing.md)\n\n| ID | Requirement |\n| -- | -- |\n| MIRA-TEST-001 | One. |\n`,
      "spec/src/orphan.md": `# Orphan\n\n| ID | Requirement |\n| -- | -- |\n| MIRA-TEST-001 | Duplicate. |\n`,
    },
    (result) => {
      assert.equal(result.ok, false);
      assert.match(result.errors.join("\n"), /broken link/);
      assert.match(result.errors.join("\n"), /orphan\.md: expected one/);
      assert.match(result.errors.join("\n"), /defined 2 times/);
    },
  );
});

test("requires verification traceability and a chapter for every plugin", () => {
  withFixture(
    {
      "packages/mira-plugin-mermaid/package.json":
        '{"name":"@lapismd/mira-plugin-mermaid"}\n',
      "spec/src/verification.md": "# Verification\n",
    },
    (result) => {
      assert.equal(result.ok, false);
      assert.match(result.errors.join("\n"), /MIRA-TEST-001: missing/);
      assert.match(result.errors.join("\n"), /plugin-mermaid: missing/);
    },
  );
});
