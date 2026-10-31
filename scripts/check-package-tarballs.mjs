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
import {
  checkPackedAudit,
  readMermaidRuntime,
} from "./packed-audit-policy.mjs";
import { checkMathArtifact } from "./build-math-adapters.mjs";
import {
  writeMathPackageFixture,
  writeMathTypesFixture,
} from "./check-math-adapters.mjs";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const FORBIDDEN_OUTPUT =
  /@mira-mde\/|@mira-internal\/|@lapismd\/mira\/internal(?:\/|["'])/;

function run(command, args, cwd, options = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: options.timeout,
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

async function main() {
  const evidenceDirectory = path.join(REPO_ROOT, ".release");
  mkdirSync(evidenceDirectory, { recursive: true });
  for (const filename of [
    "production-consumer-audit.json",
    "base-math-production-audit.json",
    "mermaid-runtime-identity.json",
  ]) {
    rmSync(path.join(evidenceDirectory, filename), { force: true });
  }
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
      if (manifest.name === "@lapismd/mira") {
        await checkMathArtifact(path.join(unpacked, "package"));
      }
      for (const file of textFiles(unpacked)) {
        const content = readFileSync(file, "utf8");
        if (
          /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)["'](?:remark-math|rehype-katex)(?:\/|["'])/.test(
            content,
          )
        ) {
          throw new Error(
            `${manifest.name}: build-only math adapter import in ${file}`,
          );
        }
        if (FORBIDDEN_OUTPUT.test(content)) {
          throw new Error(
            `${manifest.name}: leaked private or legacy import in ${path.relative(unpacked, file)}`,
          );
        }
      }
    }

    const fixtureRoot = path.join(temporaryRoot, "fixture");
    mkdirSync(fixtureRoot, { recursive: true });
    writeFileSync(
      path.join(fixtureRoot, ".npmrc"),
      "node-linker=isolated\nhoist=false\n",
    );
    // Keep all public-package references on these archives, including peers.
    writeJson(path.join(fixtureRoot, "pnpm-workspace.yaml"), {
      overrides: Object.fromEntries(
        [...tarballs].map(([name, tarball]) => [name, `file:${tarball}`]),
      ),
    });
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
    });

    const fixtures = {
      "svelte.ts": `import Mira, { type MiraProps } from "@lapismd/mira";
import MiraEditor, { MiraEditorToolbar } from "@lapismd/mira-editor";
import { mermaidExtension } from "@lapismd/mira-plugin-mermaid";
import { aiExtension } from "@lapismd/mira-plugin-ai";
import { inlineLinksExtension, createLinkIconRegistry, defaultMiraLinkIcons } from "@lapismd/mira/extensions";
import { InlineLink, LinkSiteIcon } from "@lapismd/mira/preview";
const extensions = [inlineLinksExtension({ registry: createLinkIconRegistry({ icons: { github: defaultMiraLinkIcons.gitlab }, hosts: { "git.example.com": "github" } }) })];
const props: MiraProps = { value: "# Smoke" };
props.extensions = extensions;
void [InlineLink, LinkSiteIcon];
void [Mira, MiraEditor, MiraEditorToolbar, mermaidExtension, aiExtension, props];
`,
      "frontmatter.ts": `import { FrontmatterController, type FrontmatterControllerCommit, type FrontmatterConfig } from "@lapismd/mira/preview";
type IsAny<T> = 0 extends (1 & T) ? true : false;
const resolved: IsAny<FrontmatterControllerCommit> = false;
const controller = new FrontmatterController({ record: { status: "ready" } });
function consume(commit: FrontmatterControllerCommit) {
  const prior: Readonly<Record<string, unknown>> = commit.previousRecord;
  controller.updateProperty(["status"], "local", prior);
  // @ts-expect-error A captured previous-record field cannot be reassigned.
  commit.previousRecord = {};
  // @ts-expect-error The captured record cannot be mutated by its consumer.
  commit.previousRecord.status = "changed";
}
const config: FrontmatterConfig = { onActionError(_error, action) { if (action === "edit") return; } };
void [consume, resolved, config];
`,
      "react.tsx": `import { Mira, MiraEditor, MiraEditorToolbar } from "@lapismd/mira-react";
import { inlineLinksExtension, createLinkIconRegistry } from "@lapismd/mira/extensions";
void <Mira value="# Smoke" extensions={[inlineLinksExtension({ registry: createLinkIconRegistry() })]} />;
void <MiraEditor value="# Smoke" />;
void <MiraEditorToolbar />;
`,
      "vanilla.ts": `import { createMira, createMiraEditor } from "@lapismd/mira-vanilla";
import { inlineLinksExtension, createLinkIconRegistry } from "@lapismd/mira/extensions";
const options: Parameters<typeof createMira>[1] = { value: "# Smoke", extensions: [inlineLinksExtension({ registry: createLinkIconRegistry() })] };
void options;
void [createMira, createMiraEditor];
`,
    };
    for (const [filename, source] of Object.entries(fixtures)) {
      writeFileSync(path.join(fixtureRoot, filename), source);
    }
    writeFileSync(
      path.join(fixtureRoot, "styles.mjs"),
      String.raw`import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const visited = new Set();
function check(file) {
  if (visited.has(file)) return;
  visited.add(file);
  const resolve = createRequire(file).resolve;
  for (const match of readFileSync(file, "utf8").matchAll(/@import\s+["']([^"']+)["']/g)) {
    check(resolve(match[1]));
  }
}
for (const name of ["@lapismd/mira", "@lapismd/mira-editor", "@lapismd/mira-react"]) {
  check(require.resolve(name + "/styles.css"));
}
console.log("All public stylesheet imports resolve without hoisted dependencies.");
`,
    );
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
      exclude: ["frontmatter.ts", "math-types.ts"],
    });
    writeJson(path.join(fixtureRoot, "tsconfig.frontmatter.json"), {
      extends: "./tsconfig.json",
      compilerOptions: { module: "ESNext", moduleResolution: "Bundler" },
      include: ["frontmatter.ts"],
      exclude: [],
    });

    run(
      "pnpm",
      [
        "install",
        "--prefer-offline",
        "--ignore-scripts",
        "--no-frozen-lockfile",
        "--config.node-linker=isolated",
        "--config.hoist=false",
      ],
      fixtureRoot,
    );
    writeMathTypesFixture(fixtureRoot);
    run("pnpm", ["exec", "tsc", "-p", "tsconfig.json"], fixtureRoot);
    run("pnpm", ["exec", "tsc", "-p", "tsconfig.math.json"], fixtureRoot);
    run(
      "pnpm",
      ["exec", "tsc", "-p", "tsconfig.frontmatter.json"],
      fixtureRoot,
    );
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

    console.log(run("node", ["styles.mjs"], fixtureRoot).trim());
    const mathRoot = path.join(temporaryRoot, "math-runtime");
    mkdirSync(mathRoot);
    writeMathPackageFixture(mathRoot, tarballs.get("@lapismd/mira"));
    run(
      "pnpm",
      [
        "install",
        "--prefer-offline",
        "--ignore-scripts",
        "--no-frozen-lockfile",
        "--config.node-linker=isolated",
        "--config.hoist=false",
      ],
      mathRoot,
    );
    writeMathTypesFixture(mathRoot);
    run("pnpm", ["exec", "tsc", "-p", "tsconfig.math.json"], mathRoot);
    const mathAudit = spawnSync("pnpm", ["audit", "--prod", "--json"], {
      cwd: mathRoot,
      encoding: "utf8",
      timeout: 120_000,
    });
    writeFileSync(
      path.join(evidenceDirectory, "base-math-production-audit.json"),
      mathAudit.stdout ?? "",
    );
    console.log(`Base Mira: ${checkPackedAudit(mathAudit)}`);
    for (const mode of ["development", "production"]) {
      console.log(
        run("node", ["math-runtime.mjs", mode], mathRoot, {
          timeout: 120_000,
        }).trim(),
      );
    }
    const audit = spawnSync("pnpm", ["audit", "--prod", "--json"], {
      cwd: fixtureRoot,
      encoding: "utf8",
      timeout: 120_000,
    });
    writeFileSync(
      path.join(evidenceDirectory, "production-consumer-audit.json"),
      audit.stdout ?? "",
    );
    const mermaidRuntime = readMermaidRuntime(fixtureRoot);
    writeJson(
      path.join(evidenceDirectory, "mermaid-runtime-identity.json"),
      mermaidRuntime,
    );
    console.log(checkPackedAudit(audit, mermaidRuntime));

    console.log(
      "Mira tarballs validated: six packages installed together; Svelte, React, Vanilla, CSS, and leak checks passed.",
    );
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

await main();
