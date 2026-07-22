#!/usr/bin/env node
/**
 * Start Storybook and restart it when Visual Delta manager/panel source
 * (or related .storybook Vite plugins) change.
 *
 * Why not rely on Vite HMR alone: Storybook's manager builder is a one-shot
 * esbuild bundle with no watch. Preview overlay edits still HMR via Vite
 * (see watchVisualDeltaSourcePlugin in .storybook/main.ts).
 *
 * The catalog loads the addon from package `src/` via
 * `.storybook/visual-delta-preset.ts` (not the node_modules package name).
 */
import { spawn, execSync } from "node:child_process";
import { watch, readFileSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = process.env.STORYBOOK_PORT ?? "7007";
const extraPorts = (process.env.STORYBOOK_EXTRA_PORTS ?? "9009 7008 9999")
  .trim()
  .split(/\s+/)
  .filter(Boolean);

const RESTART_DEBOUNCE_MS = 500;
/** Ignore watch events while Storybook is still booting (avoids FSEvents noise). */
const STARTUP_GRACE_MS = 10000;

const require = createRequire(import.meta.url);
const visualDeltaRoot = path.dirname(
  require.resolve("storybook-addon-visual-delta/package.json"),
);
const visualDeltaSrc = path.join(visualDeltaRoot, "src");

/**
 * Paths whose edits require a full Storybook process restart (manager /
 * middleware). Do not watch `.storybook/main.ts` — loading it can emit
 * spurious FSEvents on macOS and loop restarts.
 */
const restartWatchPaths = [
  path.join(visualDeltaSrc, "manager.tsx"),
  path.join(visualDeltaSrc, "manager"),
  path.join(visualDeltaSrc, "panel"),
  path.join(visualDeltaSrc, "constants.ts"),
  path.join(visualDeltaSrc, "types.ts"),
  path.join(visualDeltaSrc, "visual-diff-sidecar.ts"),
  path.join(visualDeltaSrc, "shared"),
  path.join(visualDeltaSrc, "preset.ts"),
  path.join(root, ".storybook/visual-delta-middleware.ts"),
  path.join(root, ".storybook/visual-delta-preset.ts"),
  path.join(root, ".storybook/visual-baseline-vite-plugin.ts"),
  path.join(root, ".storybook/visual-baseline-design.ts"),
  path.join(root, ".storybook/manager.ts"),
  path.join(root, ".storybook/manager-stacked-badges.ts"),
];

/** @type {Map<string, string>} */
const contentHashes = new Map();

function fileHash(filePath) {
  try {
    if (!existsSync(filePath) || !statSync(filePath).isFile()) return null;
    return createHash("sha1").update(readFileSync(filePath)).digest("hex");
  } catch {
    return null;
  }
}

function seedHashes(dirOrFile) {
  try {
    const st = statSync(dirOrFile);
    if (st.isFile()) {
      const h = fileHash(dirOrFile);
      if (h) contentHashes.set(dirOrFile, h);
      return;
    }
    if (!st.isDirectory()) return;
  } catch {
    return;
  }
  // Lazy: only hash on first event for files under dirs.
}

function contentChanged(filePath) {
  const next = fileHash(filePath);
  if (next === null) return false;
  const prev = contentHashes.get(filePath);
  if (prev === next) return false;
  contentHashes.set(filePath, next);
  return prev !== undefined; // ignore first observation after seed miss
}

function killPort(p) {
  try {
    const pids = execSync(`lsof -tiTCP:${p} -sTCP:LISTEN`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (!pids) return;
    for (const pid of pids.split("\n")) {
      try {
        process.kill(Number(pid), "SIGTERM");
      } catch {
        /* already gone */
      }
    }
  } catch {
    /* nothing listening */
  }
}

function freeStorybookPorts() {
  for (const p of [port, ...extraPorts]) {
    killPort(p);
  }
}

/** @type {import("node:child_process").ChildProcess | null} */
let child = null;
let starting = false;
let restartTimer = /** @type {ReturnType<typeof setTimeout> | null} */ (null);
let shuttingDown = false;
let graceUntil = 0;

function stopChild() {
  if (!child || child.killed) {
    child = null;
    return Promise.resolve();
  }
  const current = child;
  child = null;
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    current.once("exit", done);
    current.kill("SIGTERM");
    setTimeout(() => {
      if (!current.killed) {
        try {
          current.kill("SIGKILL");
        } catch {
          /* ignore */
        }
      }
      freeStorybookPorts();
      done();
    }, 1500);
  });
}

async function startStorybook() {
  if (shuttingDown || starting) return;
  starting = true;
  try {
    await stopChild();
    freeStorybookPorts();
    await new Promise((r) => setTimeout(r, 400));

    child = spawn(
      process.execPath,
      [
        path.join(root, "node_modules/storybook/dist/bin/dispatcher.js"),
        "dev",
        "-p",
        port,
        "--exact-port",
        ...process.argv.slice(2),
      ],
      {
        cwd: root,
        env: {
          ...process.env,
          WATCHPACK_POLLING: process.env.WATCHPACK_POLLING ?? "250",
        },
        stdio: "inherit",
      },
    );
    graceUntil = Date.now() + STARTUP_GRACE_MS;

    child.on("exit", (code, signal) => {
      if (child === null) return; // intentional stop for restart
      child = null;
      if (shuttingDown) {
        process.exit(code ?? (signal ? 1 : 0));
      }
      if (signal) {
        console.error(`[storybook-run] Storybook exited from signal ${signal}`);
      } else if (code) {
        console.error(`[storybook-run] Storybook exited with code ${code}`);
      }
    });
  } finally {
    starting = false;
  }
}

function scheduleRestart(reason) {
  if (shuttingDown || starting) return;
  if (Date.now() < graceUntil) return;
  if (restartTimer) clearTimeout(restartTimer);
  restartTimer = setTimeout(() => {
    restartTimer = null;
    if (Date.now() < graceUntil || starting || shuttingDown) return;
    console.log(`[storybook-run] restarting (${reason})`);
    void startStorybook();
  }, RESTART_DEBOUNCE_MS);
}

for (const watchPath of restartWatchPaths) {
  seedHashes(watchPath);
}

const watchers = restartWatchPaths.map((watchPath) => {
  try {
    const isDir = existsSync(watchPath) && statSync(watchPath).isDirectory();
    return watch(watchPath, { recursive: isDir }, (_event, filename) => {
      const changedPath = filename
        ? isDir
          ? path.join(watchPath, filename)
          : watchPath
        : watchPath;
      // Skip editor junk / non-source.
      if (/(^|[\\/])(\.DS_Store|.*~|\.swp|\.tmp)$/i.test(changedPath)) {
        return;
      }
      if (!contentChanged(changedPath)) return;
      scheduleRestart(path.relative(root, changedPath));
    });
  } catch (err) {
    console.warn(
      `[storybook-run] could not watch ${path.relative(root, watchPath)}:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    shuttingDown = true;
    if (restartTimer) clearTimeout(restartTimer);
    for (const w of watchers) w?.close();
    void stopChild().finally(() => process.exit(0));
  });
}

console.log(
  `[storybook-run] watching Visual Delta manager/panel + related .storybook files; UI at http://localhost:${port}`,
);
void startStorybook();
