import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import type { Plugin } from "vite";
import { loadSidecarForStoryId } from "../scripts/visual/diff-result.ts";
import type { StoryIndexEntry } from "../scripts/visual/snapshot-paths.ts";

const VISUAL_DELTA_UPDATE_PATH = "/__visual-delta/update-baseline";
const VISUAL_DELTA_CREATE_PATH = "/__visual-delta/create-baseline";
const VISUAL_DELTA_RUN_PATH = "/__visual-delta/run-tests";
const VISUAL_DELTA_CANCEL_PATH = "/__visual-delta/cancel-tests";
const VISUAL_DELTA_REVIEW_PATH = "/__visual-delta/review-status";

type UpdateBody = {
  storyId?: string;
  component?: string;
};

type RunBody = {
  storyIds?: string[];
  rebuild?: boolean;
};

export type VisualRunResultItem = {
  storyId: string;
  status: "passed" | "failed" | "skipped" | "timedOut";
  title: string;
  error?: string;
  sidecar?: unknown;
};

export type VisualRunResponse = {
  ok: boolean;
  exitCode: number;
  crashed?: boolean;
  error?: string;
  rebuild: boolean;
  grep?: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  results: VisualRunResultItem[];
  logTail: string;
};

let activeRun: ChildProcess | null = null;

function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
      if (chunks.reduce((n, c) => n + c.length, 0) > 64_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8") || "{}";
        resolve(JSON.parse(raw) as T);
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
    req.on("error", reject);
  });
}

function writeJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function grepFromStoryIds(storyIds?: string[]): string | undefined {
  if (!storyIds?.length) return undefined;
  if (storyIds.length === 1) {
    return `^${escapeRegExp(storyIds[0]!)}$`;
  }
  const heads = storyIds.map((id) => id.split("--")[0] ?? id);
  if (new Set(heads).size === 1) {
    return `^${escapeRegExp(heads[0]!)}--`;
  }
  return `^(${storyIds.map(escapeRegExp).join("|")})$`;
}

function componentFromStoryId(storyId?: string): string | undefined {
  if (!storyId) return undefined;
  const head = storyId.split("--")[0] ?? "";
  const match = head.match(/^markdown-(.+)$/);
  return match?.[1];
}

function runCommand(
  command: string,
  args: string[],
  cwd: string,
  env?: NodeJS.ProcessEnv,
): Promise<{ code: number; log: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    activeRun = child;
    let log = "";
    const append = (chunk: Buffer) => {
      const text = chunk.toString("utf8");
      log += text;
      if (log.length > 200_000) log = log.slice(-160_000);
    };
    child.stdout?.on("data", append);
    child.stderr?.on("data", append);
    child.on("error", (error) => {
      activeRun = null;
      reject(error);
    });
    child.on("close", (code) => {
      activeRun = null;
      resolve({ code: code ?? 1, log });
    });
  });
}

function countVisualStories(root: string, storyIds?: string[]): number {
  const indexPath = path.join(root, "storybook-static", "index.json");
  if (!existsSync(indexPath)) return storyIds?.length ?? 0;
  try {
    const index = JSON.parse(readFileSync(indexPath, "utf8")) as {
      entries?: Record<string, StoryIndexEntry>;
    };
    const stories = Object.values(index.entries ?? {}).filter(
      (e) => e.type === "story" && !(e.tags ?? []).includes("skip-visual"),
    );
    if (storyIds?.length) {
      const wanted = new Set(storyIds);
      return stories.filter((e) => wanted.has(e.id)).length;
    }
    return stories.length;
  } catch {
    return storyIds?.length ?? 0;
  }
}

function attachSidecars(
  results: VisualRunResultItem[],
  packageRoot: string,
): VisualRunResultItem[] {
  return results.map((item) => {
    const sidecar = loadSidecarForStoryId(item.storyId, packageRoot);
    return sidecar ? { ...item, sidecar } : item;
  });
}

/**
 * Slim Visual Delta middleware: create/update baselines and run Playwright
 * compare via root scripts (no full ui-generator dependency).
 */
export function visualDeltaMiddlewarePlugin(): Plugin {
  return {
    name: "mira-visual-delta-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";
        const root = process.cwd();

        if (url === VISUAL_DELTA_CANCEL_PATH && req.method === "POST") {
          if (activeRun) {
            activeRun.kill("SIGTERM");
            activeRun = null;
          }
          writeJson(res, 200, { ok: true });
          return;
        }

        if (url === VISUAL_DELTA_REVIEW_PATH && req.method === "GET") {
          writeJson(res, 200, { status: "unknown" });
          return;
        }

        if (
          (url === VISUAL_DELTA_CREATE_PATH ||
            url === VISUAL_DELTA_UPDATE_PATH) &&
          req.method === "POST"
        ) {
          try {
            const body = await readJsonBody<UpdateBody>(req);
            const component =
              body.component ?? componentFromStoryId(body.storyId);
            const mode = url === VISUAL_DELTA_CREATE_PATH ? "missing" : "all";
            const args = [
              "test:visual:update",
              "--allow-dirty",
              "--rebuild",
              "--mode",
              mode,
            ];
            if (component) {
              args.push("--component", component);
            }
            const result = await runCommand("pnpm", args, root, {
              VISUAL_UPDATE_APPROVED: "1",
            });
            writeJson(res, result.code === 0 ? 200 : 500, {
              ok: result.code === 0,
              exitCode: result.code,
              logTail: result.log.slice(-8_000),
            });
          } catch (error) {
            writeJson(res, 500, {
              ok: false,
              error: error instanceof Error ? error.message : String(error),
            });
          }
          return;
        }

        if (url === VISUAL_DELTA_RUN_PATH && req.method === "POST") {
          try {
            const body = await readJsonBody<RunBody>(req);
            if (body.rebuild) {
              await runCommand("pnpm", ["build-storybook"], root);
            }
            const grep = grepFromStoryIds(body.storyIds);
            const total = countVisualStories(root, body.storyIds);
            res.statusCode = 200;
            res.setHeader(
              "Content-Type",
              "application/x-ndjson; charset=utf-8",
            );
            res.setHeader("Cache-Control", "no-store");
            res.write(`${JSON.stringify({ type: "start", total })}\n`);

            const playwrightArgs = [
              "exec",
              "playwright",
              "test",
              "-c",
              "playwright.visual.config.ts",
              "--reporter=list",
            ];
            if (grep) playwrightArgs.push("-g", grep);

            const result = await runCommand("pnpm", playwrightArgs, root);
            const results: VisualRunResultItem[] = (body.storyIds ?? []).map(
              (storyId) => ({
                storyId,
                status: result.code === 0 ? "passed" : "failed",
                title: storyId,
              }),
            );
            const withSidecars = attachSidecars(
              results.length
                ? results
                : [
                    {
                      storyId: "suite",
                      status: result.code === 0 ? "passed" : "failed",
                      title: "suite",
                    },
                  ],
              root,
            );
            const summary = {
              total: withSidecars.length,
              passed: withSidecars.filter((r) => r.status === "passed").length,
              failed: withSidecars.filter((r) => r.status === "failed").length,
              skipped: withSidecars.filter((r) => r.status === "skipped")
                .length,
            };
            const payload: VisualRunResponse = {
              ok: result.code === 0,
              exitCode: result.code,
              rebuild: Boolean(body.rebuild),
              grep,
              summary,
              results: withSidecars,
              logTail: result.log.slice(-8_000),
            };
            res.write(`${JSON.stringify({ type: "done", ...payload })}\n`);
            res.end();
          } catch (error) {
            writeJson(res, 500, {
              ok: false,
              error: error instanceof Error ? error.message : String(error),
            });
          }
          return;
        }

        next();
      });
    },
  };
}
