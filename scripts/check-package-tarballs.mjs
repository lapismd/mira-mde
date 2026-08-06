#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PUBLIC_PACKAGE_GRAPH } from "./public-packages.mjs";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const FORBIDDEN_OUTPUT =
  /@mira-mde\/|@mira-internal\/|@lapismd\/mira\/internal(?:\/|["'])/;

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed:\n${result.stdout}${result.stderr}`,
    );
  }
  return result.stdout;
}

function textFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return textFiles(absolutePath);
    if (!entry.isFile() || !/\.(?:css|js|json|mjs|svelte|ts)$/.test(entry.name))
      return [];
    return [absolutePath];
  });
}

function writeJson(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function main() {
  const temporaryRoot = mkdtempSync(path.join(os.tmpdir(), "mira-pack-"));
  const tarballDirectory = path.join(temporaryRoot, "tarballs");
  mkdirSync(tarballDirectory, { recursive: true });

  try {
    const tarballs = new Map();
    for (const { directory } of PUBLIC_PACKAGE_GRAPH) {
      const packageDirectory = path.join(REPO_ROOT, "packages", directory);
      const before = new Set(readdirSync(tarballDirectory));
      run(
        "pnpm",
        ["pack", "--pack-destination", tarballDirectory],
        packageDirectory,
      );
      const filename = readdirSync(tarballDirectory).find(
        (candidate) => !before.has(candidate),
      );
      if (!filename) throw new Error(`No tarball produced for ${directory}`);
      const manifest = JSON.parse(
        readFileSync(path.join(packageDirectory, "package.json"), "utf8"),
      );
      tarballs.set(manifest.name, path.join(tarballDirectory, filename));

      const unpacked = path.join(temporaryRoot, "unpacked", directory);
      mkdirSync(unpacked, { recursive: true });
      run(
        "tar",
        ["-xzf", path.join(tarballDirectory, filename), "-C", unpacked],
        REPO_ROOT,
      );
      for (const file of textFiles(unpacked)) {
        if (FORBIDDEN_OUTPUT.test(readFileSync(file, "utf8"))) {
          throw new Error(
            `${manifest.name}: leaked private or legacy import in ${path.relative(unpacked, file)}`,
          );
        }
      }
    }

    const fixtureRoot = path.join(temporaryRoot, "fixture");
    mkdirSync(fixtureRoot, { recursive: true });
    writeJson(path.join(fixtureRoot, "package.json"), {
      name: "mira-package-smoke",
      private: true,
      type: "module",
      dependencies: Object.fromEntries(
        [...tarballs].map(([name, tarball]) => [name, `file:${tarball}`]),
      ),
      devDependencies: {
        "@types/react": "^19.0.0",
        "@types/react-dom": "^19.0.0",
        react: "^19.0.0",
        "react-dom": "^19.0.0",
        svelte: "^5.46.1",
        typescript: "^5.9.3",
      },
      pnpm: {
        overrides: Object.fromEntries(
          [...tarballs].map(([name, tarball]) => [name, `file:${tarball}`]),
        ),
      },
    });

    const fixtures = {
      "svelte.ts": `import Mira, { type MiraProps } from "@lapismd/mira";
import MiraEditor, { MiraEditorToolbar } from "@lapismd/mira-editor";
import { mermaidExtension } from "@lapismd/mira-plugin-mermaid";
import { aiExtension } from "@lapismd/mira-plugin-ai";
const props: MiraProps = { value: "# Smoke" };
void [Mira, MiraEditor, MiraEditorToolbar, mermaidExtension, aiExtension, props];
`,
      "react.tsx": `import { Mira, MiraEditor, MiraEditorToolbar } from "@lapismd/mira-react";
void <Mira value="# Smoke" />;
void <MiraEditor value="# Smoke" />;
void <MiraEditorToolbar />;
`,
      "vanilla.ts": `import { createMira, createMiraEditor } from "@lapismd/mira-vanilla";
void [createMira, createMiraEditor];
`,
    };
    for (const [filename, source] of Object.entries(fixtures)) {
      writeFileSync(path.join(fixtureRoot, filename), source);
    }
    writeJson(path.join(fixtureRoot, "tsconfig.json"), {
      compilerOptions: {
        jsx: "react-jsx",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        noEmit: true,
        skipLibCheck: true,
        strict: true,
        target: "ES2022",
      },
      include: ["*.ts", "*.tsx"],
    });

    run(
      "pnpm",
      [
        "install",
        "--prefer-offline",
        "--ignore-scripts",
        "--no-frozen-lockfile",
      ],
      fixtureRoot,
    );
    run("pnpm", ["exec", "tsc", "-p", "tsconfig.json"], fixtureRoot);
    run(
      "node",
      [
        "--input-type=module",
        "--eval",
        [
          'import.meta.resolve("@lapismd/mira/styles.css")',
          'import.meta.resolve("@lapismd/mira/themes.css")',
          'import.meta.resolve("@lapismd/mira/themes/mira.css")',
          'import.meta.resolve("@lapismd/mira/themes/obsidian.css")',
          'import.meta.resolve("@lapismd/mira-editor/styles.css")',
          'import.meta.resolve("@lapismd/mira-react/styles.css")',
        ].join(";"),
      ],
      fixtureRoot,
    );

    console.log(
      "Mira tarballs validated: six packages installed together; Svelte, React, Vanilla, CSS, and leak checks passed.",
    );
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

main();
