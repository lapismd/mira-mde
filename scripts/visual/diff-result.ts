import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  nestedSnapshotFileName,
  screenshotRelativePath,
  type StoryIndexEntry,
} from "./snapshot-paths.js";
import {
  PLAYWRIGHT_PASS_THRESHOLD_PERCENT,
  type VisualDiffSidecar,
  type VisualDiffSidecarStatus,
} from "./visual-diff-sidecar.js";

export type { VisualDiffSidecar, VisualDiffSidecarStatus };
export { PLAYWRIGHT_PASS_THRESHOLD_PERCENT };

export const VISUAL_SNAPSHOT_DIR = "tests/visual/storybook.spec.ts-snapshots";

/** Absolute path to the on-disk baseline PNG for a story (chromium). */
export function baselinePngPath(
  entry: StoryIndexEntry,
  packageRoot: string,
  project = "chromium",
): string {
  return path.join(
    packageRoot,
    VISUAL_SNAPSHOT_DIR,
    nestedSnapshotFileName(entry, project),
  );
}

/** Absolute path to the ephemeral JSON sidecar (same basename as PNG). */
export function sidecarJsonPath(baselinePngAbs: string): string {
  return baselinePngAbs.replace(/\.png$/i, ".json");
}

/** Ephemeral actual capture written beside the baseline during a visual run. */
export function actualPngPath(baselinePngAbs: string): string {
  return baselinePngAbs.replace(/\.png$/i, ".actual.png");
}

/** Ephemeral pixelmatch heatmap written beside the baseline during a visual run. */
export function diffPngPath(baselinePngAbs: string): string {
  return baselinePngAbs.replace(/\.png$/i, ".diff.png");
}

/** Path relative to the snapshot root, for `/visual-baselines/<rel>` URLs. */
export function snapshotPublicRel(
  absPath: string,
  packageRoot: string,
): string {
  return path
    .relative(path.join(packageRoot, VISUAL_SNAPSHOT_DIR), absPath)
    .replace(/\\/g, "/");
}

export function sidecarPathForEntry(
  entry: StoryIndexEntry,
  packageRoot: string,
  project = "chromium",
): string {
  return sidecarJsonPath(baselinePngPath(entry, packageRoot, project));
}

export function writeVisualDiffSidecar(
  filePath: string,
  sidecar: VisualDiffSidecar,
): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(sidecar, null, 2)}\n`, "utf8");
}

export function buildSidecarBase(
  entry: StoryIndexEntry,
  status: VisualDiffSidecarStatus,
  error?: string,
): Omit<
  VisualDiffSidecar,
  | "imageWidth"
  | "imageHeight"
  | "diffPixels"
  | "totalPixels"
  | "diffPercent"
  | "passThresholdPercent"
  | "passed"
  | "changeBounds"
  | "diffHistogram"
  | "actualRel"
  | "diffRel"
> {
  return {
    version: 1,
    storyId: entry.id,
    title: entry.title,
    snapshotRel: screenshotRelativePath(entry),
    status,
    ...(error ? { error } : {}),
    generatedAt: new Date().toISOString(),
    tool: "playwright",
  };
}

export function readVisualDiffSidecar(
  filePath: string,
): VisualDiffSidecar | null {
  try {
    const raw = readFileSync(filePath, "utf8");
    const data = JSON.parse(raw) as VisualDiffSidecar;
    if (data?.version !== 1 || !data.storyId) return null;
    return data;
  } catch {
    return null;
  }
}

/** Load sidecar for a story id using storybook-static/index.json for paths. */
export function loadSidecarForStoryId(
  storyId: string,
  packageRoot: string,
  project = "chromium",
): VisualDiffSidecar | null {
  const indexPath = path.join(packageRoot, "storybook-static", "index.json");
  try {
    const index = JSON.parse(readFileSync(indexPath, "utf8")) as {
      entries?: Record<string, StoryIndexEntry>;
    };
    const entry = index.entries?.[storyId];
    if (!entry?.importPath) return null;
    return readVisualDiffSidecar(
      sidecarPathForEntry(entry, packageRoot, project),
    );
  } catch {
    return null;
  }
}
