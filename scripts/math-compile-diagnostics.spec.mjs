import assert from "node:assert/strict";
import { createRequire } from "node:module";
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
import {
  createMathCompileDiagnostics,
  dndCompileScope,
} from "./math-compile-diagnostics.mjs";

const require = createRequire(
  new URL("../packages/mira/package.json", import.meta.url),
);
const installed = path.join(
  path.dirname(require.resolve("@dnd-kit/svelte")),
  "context/DragDropProvider.svelte",
);

function fixture(run, change = {}) {
  const directory = mkdtempSync(path.join(os.tmpdir(), "mira-compile-scope-"));
  const filename = path.join(directory, change.file ?? dndCompileScope.file);
  mkdirSync(path.dirname(filename), { recursive: true });
  writeFileSync(
    path.join(directory, "package.json"),
    JSON.stringify({
      name: change.package ?? dndCompileScope.package,
      version: change.version ?? dndCompileScope.version,
    }),
  );
  writeFileSync(filename, change.source ?? readFileSync(installed));
  try {
    run({
      directory,
      warning: {
        code: dndCompileScope.code,
        message: dndCompileScope.message,
        filename,
        frame: "raw frame retained",
      },
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("accepts at most one exact warning through the approved final day and retains raw evidence", () =>
  fixture(({ directory, warning }) => {
    const emitted = [];
    const evidencePath = path.join(directory, "evidence.json");
    const gate = createMathCompileDiagnostics({
      mode: "production",
      evidencePath,
      now: () => new Date("2026-11-30T23:59:59Z"),
      emit: (w) => emitted.push(w),
    });
    gate(warning);
    let receipt = JSON.parse(readFileSync(evidencePath));
    assert.equal(receipt.accepted, 1);
    assert.deepEqual(receipt.warnings, [warning]);
    assert.deepEqual(emitted, [warning]);
    assert.throws(() => gate(warning), /Fatal compiler diagnostic/);
    receipt = JSON.parse(readFileSync(evidencePath));
    assert.deepEqual(receipt.warnings, [warning, warning]);
    assert.deepEqual(emitted, [warning, warning]);
  }));

test("development, expiration and changed diagnostics remain fatal", () =>
  fixture(({ warning }) => {
    for (const options of [
      { mode: "development" },
      { now: () => new Date("2026-12-01T00:00:00Z") },
    ]) {
      const gate = createMathCompileDiagnostics({
        mode: "production",
        now: () => new Date("2026-10-31T00:00:00Z"),
        emit: () => {},
        ...options,
      });
      assert.throws(() => gate(warning), /Fatal compiler diagnostic/);
    }
    for (const changed of [
      { code: "other" },
      { message: "other" },
      { filename: undefined },
    ]) {
      const gate = createMathCompileDiagnostics({
        mode: "production",
        now: () => new Date("2026-10-31T00:00:00Z"),
        emit: () => {},
      });
      assert.throws(
        () => gate({ ...warning, ...changed }),
        /Fatal compiler diagnostic/,
      );
    }
  }));

test("changed package, version, path and source hash remain fatal", () => {
  for (const change of [
    { package: "other" },
    { version: "0.5.1" },
    { file: "other/DragDropProvider.svelte" },
    { source: "changed" },
  ])
    fixture(({ warning }) => {
      const gate = createMathCompileDiagnostics({
        mode: "production",
        now: () => new Date("2026-10-31T00:00:00Z"),
        emit: () => {},
      });
      assert.throws(() => gate(warning), /Fatal compiler diagnostic/);
    }, change);
});
