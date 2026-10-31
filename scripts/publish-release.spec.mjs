import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import * as publishing from "./publish-release.mjs";

import {
  parsePublishedIntegrity,
  publishVerifiedPackages,
} from "./publish-release.mjs";

const packageRecord = {
  name: "@lapismd/mira",
  version: "0.0.1",
  integrity: "sha512-verified",
};

test("approved publication overrides inherited npm dry-run configuration", () => {
  assert.equal(typeof publishing.publicationEnv, "function");
  const env = publishing.publicationEnv({
    ...process.env,
    npm_config_dry_run: "true",
    NPM_CONFIG_DRY_RUN: "true",
    ACTIONS_ID_TOKEN_REQUEST_TOKEN: "synthetic-test-only",
  });
  const result = spawnSync("npm", ["config", "get", "dry-run"], {
    env,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), "false");
  assert.equal(env.ACTIONS_ID_TOKEN_REQUEST_TOKEN, "synthetic-test-only");
});

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

test("admits only manual main publication bound to the approved source", () => {
  assert.equal(typeof publishing.assertPublicationApproval, "function");
  const commit = "a".repeat(40);
  const manifest = { commit, bootstrapRequired: false };
  const env = {
    CI: "true",
    GITHUB_REF: "refs/heads/main",
    GITHUB_EVENT_NAME: "workflow_dispatch",
    MIRA_PUBLISH_REQUESTED: "true",
    MIRA_RELEASE_APPROVED: "1",
    MIRA_RELEASE_APPROVED_SOURCE: commit,
    ACTIONS_ID_TOKEN_REQUEST_URL: "https://oidc.invalid",
    ACTIONS_ID_TOKEN_REQUEST_TOKEN: "synthetic-test-only",
  };
  assert.doesNotThrow(() =>
    publishing.assertPublicationApproval(manifest, env),
  );
  for (const patch of [
    { GITHUB_EVENT_NAME: "push" },
    { GITHUB_REF: "refs/heads/proposal" },
    { MIRA_PUBLISH_REQUESTED: "false" },
    { MIRA_RELEASE_APPROVED_SOURCE: "" },
    { MIRA_RELEASE_APPROVED_SOURCE: "b".repeat(40) },
    { MIRA_RELEASE_APPROVED: "0" },
    { CI: "false" },
    { ACTIONS_ID_TOKEN_REQUEST_TOKEN: "" },
  ]) {
    assert.throws(() =>
      publishing.assertPublicationApproval(manifest, { ...env, ...patch }),
    );
  }
  assert.throws(() =>
    publishing.assertPublicationApproval(
      { ...manifest, bootstrapRequired: true },
      env,
    ),
  );
});
