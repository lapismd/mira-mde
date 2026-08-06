import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { PUBLIC_PACKAGE_GRAPH } from "./public-packages.mjs";
import {
  sha512Integrity,
  validateReleaseManifest,
} from "./release-manifest.mjs";

function fixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), "mira-manifest-"));
  for (const definition of PUBLIC_PACKAGE_GRAPH) {
    const directory = path.join(root, "packages", definition.directory);
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      path.join(directory, "package.json"),
      `${JSON.stringify({ name: definition.name, version: "0.0.1" })}\n`,
    );
  }
  const releaseRoot = path.join(root, ".release");
  mkdirSync(path.join(releaseRoot, "tarballs"), { recursive: true });
  const tarball = path.join(releaseRoot, "tarballs/mira.tgz");
  writeFileSync(tarball, "verified tarball bytes");
  return { root, releaseRoot, tarball };
}

test("validates commit, graph order, local version, and tarball integrity", () => {
  const { root, releaseRoot, tarball } = fixture();
  try {
    const manifest = {
      schemaVersion: 1,
      commit: "abc123",
      bootstrapRequired: true,
      packages: [
        {
          name: "@lapismd/mira",
          version: "0.0.1",
          order: 0,
          tarball: "tarballs/mira.tgz",
          integrity: sha512Integrity(tarball),
          changelog: "## 0.0.1\n\n- Initial release.",
        },
      ],
    };
    assert.equal(
      validateReleaseManifest({
        manifest,
        releaseRoot,
        repoRoot: root,
        expectedCommit: "abc123",
      }).ok,
      true,
    );

    manifest.integrity = "sha512-invalid";
    manifest.packages[0].integrity = "sha512-invalid";
    const invalid = validateReleaseManifest({
      manifest,
      releaseRoot,
      repoRoot: root,
      expectedCommit: "different",
    });
    assert.equal(invalid.ok, false);
    assert.match(invalid.errors.join("\n"), /commit/);
    assert.match(invalid.errors.join("\n"), /integrity/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects traversal outside the release artifact", () => {
  const { root, releaseRoot } = fixture();
  try {
    const invalid = validateReleaseManifest({
      manifest: {
        schemaVersion: 1,
        commit: "abc123",
        bootstrapRequired: true,
        packages: [
          {
            name: "@lapismd/mira",
            version: "0.0.1",
            order: 0,
            tarball: "../mira.tgz",
            integrity: "sha512-invalid",
            changelog: "## 0.0.1",
          },
        ],
      },
      releaseRoot,
      repoRoot: root,
      expectedCommit: "abc123",
    });
    assert.equal(invalid.ok, false);
    assert.match(invalid.errors.join("\n"), /invalid tarball path/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
