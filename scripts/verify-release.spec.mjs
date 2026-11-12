import assert from "node:assert/strict";
import test from "node:test";

import { runVerificationCommand } from "./verify-release.mjs";

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
