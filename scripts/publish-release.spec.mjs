import assert from "node:assert/strict";
import test from "node:test";

import {
  parsePublishedIntegrity,
  publishVerifiedPackages,
} from "./publish-release.mjs";

const packageRecord = {
  name: "@lapismd/mira",
  version: "0.0.1",
  integrity: "sha512-verified",
};

test("publishes missing versions and verifies their exact integrity", async () => {
  const published = [];
  const results = await publishVerifiedPackages(
    { packages: [packageRecord] },
    {
      getIntegrity: () => null,
      publish: (record) => published.push(record.name),
      waitForIntegrity: () => "sha512-verified",
    },
  );
  assert.deepEqual(published, ["@lapismd/mira"]);
  assert.equal(results[0].status, "published");
});

test("makes an exact-integrity rerun idempotent", async () => {
  let publishCalls = 0;
  const results = await publishVerifiedPackages(
    { packages: [packageRecord] },
    {
      getIntegrity: () => "sha512-verified",
      publish: () => {
        publishCalls += 1;
      },
    },
  );
  assert.equal(publishCalls, 0);
  assert.equal(results[0].status, "already-published");
});

test("rejects an existing version with different bytes", async () => {
  await assert.rejects(
    publishVerifiedPackages(
      { packages: [packageRecord] },
      {
        getIntegrity: () => "sha512-other",
        publish: () => undefined,
      },
    ),
    /different integrity/,
  );
});

test("normalizes npm integrity scalar output", () => {
  assert.equal(
    parsePublishedIntegrity('"sha512-verified"\n'),
    "sha512-verified",
  );
});

test("normalizes npm 12 single-result integrity output", () => {
  assert.equal(
    parsePublishedIntegrity('["sha512-verified"]\n'),
    "sha512-verified",
  );
});

test("rejects ambiguous npm integrity output", () => {
  assert.throws(
    () => parsePublishedIntegrity('["sha512-verified", "sha512-unexpected"]'),
    /unexpected response/,
  );
});
