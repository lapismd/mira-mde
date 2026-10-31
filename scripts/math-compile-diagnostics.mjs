import { createHash } from "node:crypto";
import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";

// Explicit user acceptance on 2026-10-31; no other diagnostic is accepted.
export const dndCompileScope = Object.freeze({
  package: "@dnd-kit/svelte",
  version: "0.4.0",
  file: "dist/core/context/DragDropProvider.svelte",
  sha256: "9750aa31f409e0f6be0e70b3fef6c8d8e8e447ff25b150fbc2dd4bec4781eaab",
  code: "state_referenced_locally",
  message:
    "This reference only captures the initial value of `managerProp`. Did you mean to reference it inside a closure instead?\nhttps://svelte.dev/e/state_referenced_locally",
  expires: "2026-11-30",
});

function matchesSource(filename) {
  if (typeof filename !== "string") return false;
  const source = realpathSync(filename);
  let directory = path.dirname(source);
  while (directory !== path.dirname(directory)) {
    try {
      const manifest = JSON.parse(
        readFileSync(path.join(directory, "package.json"), "utf8"),
      );
      return (
        manifest.name === dndCompileScope.package &&
        manifest.version === dndCompileScope.version &&
        path.relative(directory, source).split(path.sep).join("/") ===
          dndCompileScope.file &&
        createHash("sha256").update(readFileSync(source)).digest("hex") ===
          dndCompileScope.sha256
      );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    directory = path.dirname(directory);
  }
  return false;
}

/** One exact production-only warning; raw warnings are printed and retained. */
export function createMathCompileDiagnostics({
  mode,
  evidencePath,
  now = () => new Date(),
  emit = (warning) =>
    console.log(JSON.stringify({ kind: "raw-compiler-diagnostic", warning })),
}) {
  const receipt = {
    mode,
    source: process.env.MIRA_CHECK_REVISION ?? process.env.GITHUB_SHA ?? null,
    scope: dndCompileScope,
    accepted: 0,
    warnings: [],
  };
  const retain = () => {
    if (evidencePath)
      writeFileSync(evidencePath, JSON.stringify(receipt, null, 2) + "\n");
  };
  retain();
  return (warning) => {
    receipt.warnings.push(warning);
    retain();
    emit(warning);
    if (
      mode === "production" &&
      now().toISOString().slice(0, 10) <= dndCompileScope.expires &&
      receipt.warnings.length === 1 &&
      warning.code === dndCompileScope.code &&
      warning.message === dndCompileScope.message &&
      matchesSource(warning.filename)
    ) {
      receipt.accepted = 1;
      retain();
      return;
    }
    throw new Error(`Fatal compiler diagnostic: ${warning.message}`);
  };
}
