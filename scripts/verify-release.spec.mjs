import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { runVerificationCommand } from "./verify-release.mjs";
import * as verification from "./verify-release.mjs";

test("clean verification installs the complete verified batch through the source-pinned npm12 policy", async (t) => {
  assert.equal(typeof verification.installVerifiedConsumer, "function");
  const calls = [];
  const installer = {};
  const api = {
    registryInstaller(...args) {
      calls.push(["profile", ...args]);
      return installer;
    },
    async installPublishedConsumer(options) {
      calls.push(["install", options]);
    },
  };
  const packages = [
    {
      name: "@lapismd/mira",
      version: "0.2.0",
      integrity: "sha512-" + Buffer.alloc(64, 1).toString("base64"),
    },
    {
      name: "@lapismd/mira-editor",
      version: "0.0.5",
      integrity: "sha512-" + Buffer.alloc(64, 2).toString("base64"),
    },
  ];
  const root = mkdtempSync(path.join(tmpdir(), "mira-install-policy-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  await verification.installVerifiedConsumer(
    { packages, registry: "https://registry.npmjs.org" },
    root,
    api,
  );
  assert.deepEqual(calls[0], ["profile", "npm12-default-peers", "12.0.2"]);
  assert.deepEqual(calls[1][1], {
    cwd: root,
    entries: packages,
    registry: "https://registry.npmjs.org",
    policy: { budgetMs: 300000, delaysMs: Array(29).fill(10000) },
    installer,
  });
  assert.deepEqual(
    JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")),
    {
      name: "mira-release-verification",
      private: true,
      dependencies: Object.fromEntries(
        packages.map(({ name, version }) => [name, version]),
      ),
    },
  );
});

test("missing shared setup or a failed shared installation cannot fall back to the old installer", async (t) => {
  for (const value of [
    "",
    "relative/registry-readiness.mjs",
    "/tmp/unreviewed.mjs",
  ])
    await assert.rejects(
      verification.loadRegistryReadiness(value),
      /source-pinned/,
    );
  const root = mkdtempSync(path.join(tmpdir(), "mira-install-failure-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const failure = Error("exact identity disagreement");
  await assert.rejects(
    verification.installVerifiedConsumer(
      { packages: [], registry: "https://registry.npmjs.org" },
      root,
      {
        registryInstaller: () => ({}),
        installPublishedConsumer: async () => {
          throw failure;
        },
      },
    ),
    (error) => error === failure,
  );
});

test("shared setup runs in verification while immutable source checks and complete signature evidence stay mandatory", () => {
  const workflow = readFileSync(
    new URL("../.github/workflows/release.yml", import.meta.url),
    "utf8",
  );
  const verify = workflow.match(/\n {2}verify:[\s\S]*?(?=\n {2}notes:)/)?.[0];
  assert(verify);
  assert.match(
    verify,
    /setup-registry-readiness@69a81e05ca32dc5b7024ef2cd0711860b1813926/,
  );
  assert(
    verify.indexOf("setup-registry-readiness@") <
      verify.indexOf("release:verify"),
  );
  assert.doesNotMatch(
    verify,
    /id-token: write|MIRA_RELEASE_APPROVED:|release:publish/,
  );
  const source = readFileSync(
    new URL("./verify-release.mjs", import.meta.url),
    "utf8",
  );
  const main = source.slice(source.indexOf("async function main()"));
  assert(
    main.indexOf("validateReleaseManifest(") <
      main.indexOf("verifyRegistryIntegrity(manifest)"),
  );
  assert(
    main.indexOf("verifyRegistryIntegrity(manifest)") <
      main.indexOf("await installVerifiedConsumer("),
  );
  assert(
    main.indexOf("await installVerifiedConsumer(") <
      main.indexOf('"audit", "signatures"'),
  );
  assert(
    main.indexOf('"audit", "signatures"') <
      main.indexOf("verifyNpmProvenance("),
  );
  assert.match(main, /if \(installedManifest.version !== record.version\)/);
  assert.match(
    main,
    /rmSync\(temporaryRoot, \{ recursive: true, force: true \}\)/,
  );
  const recovery = readFileSync(
    new URL(
      "../.github/workflows/verify-published-release.yml",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(
    recovery,
    /setup-registry-readiness@69a81e05ca32dc5b7024ef2cd0711860b1813926/,
  );
  assert(
    recovery.indexOf("setup-registry-readiness@") <
      recovery.indexOf("pnpm release:verify"),
  );
  assert.doesNotMatch(
    recovery,
    /id-token: write|release:publish|NODE_AUTH_TOKEN|NPM_TOKEN/,
  );
});

test("retains complete signature audit output larger than the child-process buffer", () => {
  const size = 4 * 1024 * 1024;
  const output = runVerificationCommand(
    process.execPath,
    [
      "-e",
      `process.stdout.write(JSON.stringify({evidence:'x'.repeat(${size})}))`,
    ],
    process.cwd(),
  );
  assert.equal(JSON.parse(output).evidence.length, size);
});

test("large stderr cannot hide a failed verifier process", () => {
  assert.throws(
    () =>
      runVerificationCommand(
        process.execPath,
        [
          "-e",
          "process.stderr.write('x'.repeat(2*1024*1024));process.exitCode=7",
        ],
        process.cwd(),
      ),
    (error) =>
      error.message.includes("failed:") &&
      error.message.endsWith("x".repeat(2 * 1024 * 1024)),
  );
});

test("spawn failures remain failures", () => {
  assert.throws(
    () =>
      runVerificationCommand(
        "mira-nonexistent-verification-command",
        [],
        process.cwd(),
      ),
    { code: "ENOENT" },
  );
});
