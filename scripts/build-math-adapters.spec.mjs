import assert from "node:assert/strict";
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { checkMathArtifact } from "./build-math-adapters.mjs";

const packageDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../packages/mira",
);

function fixture(run) {
  const directory = mkdtempSync(path.join(os.tmpdir(), "mira-math-artifact-"));
  cpSync(
    path.join(packageDirectory, "package.json"),
    path.join(directory, "package.json"),
  );
  cpSync(
    path.join(packageDirectory, "dist/preview"),
    path.join(directory, "dist/preview"),
    { recursive: true },
  );
  return Promise.resolve()
    .then(() => run(directory))
    .finally(() => rmSync(directory, { recursive: true, force: true }));
}

test("built math artifact has explicit runtimes and retained MIT notices", async () => {
  const receipt = await checkMathArtifact(packageDirectory);
  assert(receipt.packages.length >= 4);
  const notices = readFileSync(
    path.join(packageDirectory, "dist/preview", receipt.notices),
    "utf8",
  );
  for (const entry of receipt.packages) {
    assert(notices.includes(`${entry.name}@${entry.version}`));
  }
  assert.match(notices, /Permission is hereby granted/);
});

test("missing copyright notices fail the packed boundary", () =>
  fixture(async (directory) => {
    rmSync(path.join(directory, "dist/preview/math-plugins.LICENSE.txt"));
    await assert.rejects(checkMathArtifact(directory), /ENOENT|artifact/);
  }));

test("changed bundle bytes fail the packed boundary", () =>
  fixture(async (directory) => {
    writeFileSync(
      path.join(directory, "dist/preview/math-plugins.js"),
      "export const changed = true;",
    );
    await assert.rejects(checkMathArtifact(directory), /artifact/);
  }));

test("unpatched KaTeX and runtime adapters fail manifest acceptance", () =>
  fixture(async (directory) => {
    const file = path.join(directory, "package.json");
    const manifest = JSON.parse(readFileSync(file, "utf8"));
    manifest.dependencies.katex = "^0.16.0";
    writeFileSync(file, JSON.stringify(manifest));
    await assert.rejects(checkMathArtifact(directory), /patched KaTeX/);
    manifest.dependencies.katex = "0.18.10";
    manifest.dependencies["rehype-katex"] = "^7.0.1";
    writeFileSync(file, JSON.stringify(manifest));
    await assert.rejects(checkMathArtifact(directory), /build-only/);
  }));
