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

import { syncEditorVersion } from "./sync-release-versions.mjs";

function fixture(version, sourceVersion) {
  const root = mkdtempSync(path.join(os.tmpdir(), "mira-version-"));
  const packageRoot = path.join(root, "packages/mira-editor");
  mkdirSync(path.join(packageRoot, "src"), { recursive: true });
  writeFileSync(
    path.join(packageRoot, "package.json"),
    `${JSON.stringify({ version })}\n`,
  );
  writeFileSync(
    path.join(packageRoot, "src/version.ts"),
    `export const MIRA_EDITOR_VERSION = "${sourceVersion}";\n`,
  );
  return root;
}

test("checks and writes the editor version from its package manifest", () => {
  const repoRoot = fixture("0.2.0", "0.1.0");
  try {
    const before = syncEditorVersion({ repoRoot });
    assert.equal(before.synchronized, false);
    assert.equal(before.currentVersion, "0.1.0");

    const written = syncEditorVersion({ repoRoot, write: true });
    assert.equal(written.changed, true);
    assert.match(
      readFileSync(
        path.join(repoRoot, "packages/mira-editor/src/version.ts"),
        "utf8",
      ),
      /"0\.2\.0"/,
    );
    assert.equal(syncEditorVersion({ repoRoot }).synchronized, true);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("rejects prerelease package versions", () => {
  const repoRoot = fixture("0.2.0-next.1", "0.2.0-next.1");
  try {
    assert.throws(
      () => syncEditorVersion({ repoRoot }),
      /version is not stable/,
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
