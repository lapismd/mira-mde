import assert from "node:assert/strict";
import test from "node:test";

import { packageReleaseTag } from "./create-github-releases.mjs";

test("uses an independent package-version tag", () => {
  assert.equal(
    packageReleaseTag({ name: "@lapismd/mira-plugin-ai", version: "0.2.1" }),
    "mira-plugin-ai@0.2.1",
  );
});
