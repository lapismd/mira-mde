import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { validateSpecStorybook } from "./check-spec-storybook.mjs";

function fixture({ extraMirror = "", registry = true } = {}) {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), "mira-spec-stories-"));
  const files = {
    "spec/src/SUMMARY.md":
      "# Summary\n\n- [System](index.md)\n- [AI](plugins/ai.md)\n",
    "stories/spec/System.mdx":
      'import source from "../../spec/src/index.md?raw";\n',
    "stories/spec/Ai.mdx":
      'import source from "../../spec/src/plugins/ai.md?raw";\n',
    ...(extraMirror
      ? {
          "stories/spec/Stale.mdx": `import source from "../../spec/src/${extraMirror}?raw";\n`,
        }
      : {}),
    ...(registry
      ? {
          "stories/spec/spec-chapters.ts":
            'source: "index.md"\nsource: "plugins/ai.md"\n',
        }
      : {}),
  };
  for (const [relativePath, source] of Object.entries(files)) {
    const absolutePath = path.join(repoRoot, relativePath);
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, source);
  }
  return repoRoot;
}

function verify(options, assertion) {
  const repoRoot = fixture(options);
  try {
    assertion(validateSpecStorybook({ repoRoot }));
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
}

test("accepts a one-to-one Storybook mirror for every summary chapter", () => {
  verify({}, (result) => {
    assert.equal(result.ok, true);
    assert.deepEqual(result.stats, { chapters: 2, mirrors: 2 });
  });
});

test("rejects missing and stale Storybook mirrors", () => {
  verify({ extraMirror: "retired.md" }, (result) => {
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /stale spec mirror retired\.md/);
  });
});

test("requires the link-rewriting registry", () => {
  verify({ registry: false }, (result) => {
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /spec-chapters\.ts is missing/);
  });
});
