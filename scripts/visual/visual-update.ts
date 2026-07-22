#!/usr/bin/env tsx
/**
 * Gated visual baseline create/update.
 *
 * Usage:
 *   VISUAL_UPDATE_APPROVED=1 pnpm test:visual:update
 *   VISUAL_UPDATE_APPROVED=1 pnpm test:visual:update --component callouts
 *   VISUAL_UPDATE_APPROVED=1 pnpm test:visual:update --mode missing
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(".");
const args = process.argv.slice(2);

function flagValue(name: string): string | undefined {
  const idx = args.indexOf(name);
  if (idx === -1) return undefined;
  return args[idx + 1];
}

const component = flagValue("--component");
const mode = flagValue("--mode") ?? "all";
const allowDirty = args.includes("--allow-dirty");

if (process.env.VISUAL_UPDATE_APPROVED !== "1") {
  console.error(
    "Refusing to update baselines. Set VISUAL_UPDATE_APPROVED=1 to proceed.",
  );
  process.exit(1);
}

if (!allowDirty) {
  const status = spawnSync("git", ["status", "--porcelain"], {
    cwd: root,
    encoding: "utf8",
  });
  if (status.status === 0 && status.stdout.trim()) {
    console.error(
      "Working tree is dirty. Commit/stash first, or pass --allow-dirty.",
    );
    process.exit(1);
  }
}

const staticIndex = resolve(root, "storybook-static/index.json");
if (!existsSync(staticIndex) || args.includes("--rebuild")) {
  console.log("Building Storybook…");
  const build = spawnSync("pnpm", ["build-storybook"], {
    cwd: root,
    stdio: "inherit",
  });
  if (build.status !== 0) process.exit(build.status ?? 1);
}

const grep = component
  ? `^markdown-${component.toLowerCase().replace(/\s+/g, "-")}--`
  : undefined;

const playwrightArgs = [
  "exec",
  "playwright",
  "test",
  "-c",
  "playwright.visual.config.ts",
  "--update-snapshots",
];
if (grep) {
  playwrightArgs.push("-g", grep);
}

console.log(
  `Updating snapshots${component ? ` for ${component}` : ""} (mode=${mode})…`,
);
const update = spawnSync("pnpm", playwrightArgs, {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    PLAYWRIGHT_UPDATE_SNAPSHOTS: "1",
    PLAYWRIGHT_UPDATE_MODE: mode === "missing" ? "missing" : "all",
  },
});

process.exit(update.status ?? 1);
