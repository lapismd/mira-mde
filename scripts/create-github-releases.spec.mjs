import assert from "node:assert/strict";
import test from "node:test";

import {
  packageReleaseBody,
  packageReleaseTag,
} from "./create-github-releases.mjs";
import { PUBLIC_PACKAGE_GRAPH } from "./public-packages.mjs";

test("uses an independent package-version tag", () => {
  assert.equal(
    packageReleaseTag({ name: "@lapismd/mira-plugin-ai", version: "0.2.1" }),
    "mira-plugin-ai@0.2.1",
  );
});

test("maps every public package to a package-version GitHub tag", () => {
  assert.deepEqual(
    PUBLIC_PACKAGE_GRAPH.map(({ name }) =>
      packageReleaseTag({ name, version: "0.0.1" }),
    ),
    [
      "mira@0.0.1",
      "mira-plugin-ai@0.0.1",
      "mira-plugin-mermaid@0.0.1",
      "mira-editor@0.0.1",
      "mira-react@0.0.1",
      "mira-vanilla@0.0.1",
    ],
  );
});

test("documents npm, source, changelog, integrity, and commit in release notes", () => {
  const body = packageReleaseBody({
    name: "@lapismd/mira",
    version: "0.2.0",
    directory: "packages/mira",
    changelogPath: "packages/mira/CHANGELOG.md",
    changelog: "## 0.2.0\n\n- Add a release note.",
    integrity: "sha512-example",
    commit: "abc123",
  });

  assert.match(body, /## 0\.2\.0/);
  assert.match(
    body,
    /https:\/\/www\.npmjs\.com\/package\/@lapismd\/mira\/v\/0\.2\.0/,
  );
  assert.match(body, /Source path: `packages\/mira`/);
  assert.match(body, /Changelog: `packages\/mira\/CHANGELOG\.md`/);
  assert.match(body, /Verified npm integrity: `sha512-example`/);
  assert.match(body, /Source commit: `abc123`/);
});
