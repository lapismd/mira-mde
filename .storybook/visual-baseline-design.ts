/**
 * Map catalog Storybook stories to committed Playwright visual baselines
 * served via staticDirs at `/visual-baselines`.
 */

import { snapshotDirFromImportPath } from "../scripts/visual/snapshot-paths.ts";

export const VISUAL_BASELINE_SUFFIX = "-chromium-darwin";

export type BaselineStoryRef = {
  title?: string;
  id?: string;
  importPath?: string;
  tags?: string[];
};

export function storySlugFromId(storyId: string): string {
  const parts = storyId.split("--");
  if (parts.length < 2) {
    throw new Error(`Unexpected story id (missing --): ${storyId}`);
  }
  return parts.slice(1).join("--");
}

export function familyFromTitle(title: string): string {
  const segment = title.split("/").pop()?.trim() ?? "";
  return segment.toLowerCase().replace(/\s+/g, "-");
}

function isWiredSnapshotDir(directory: string): boolean {
  return (
    directory.startsWith("markdown/") || directory.startsWith("default-ui/")
  );
}

export function baselineUrlForStory(
  story: BaselineStoryRef,
): string | undefined {
  const title = story.title ?? "";
  const id = story.id ?? "";
  const tags = story.tags ?? [];

  if (tags.includes("skip-visual")) return undefined;
  if (!id.includes("--")) return undefined;

  if (story.importPath) {
    const directory = snapshotDirFromImportPath(story.importPath);
    if (isWiredSnapshotDir(directory)) {
      return `/visual-baselines/${directory}/${storySlugFromId(id)}${VISUAL_BASELINE_SUFFIX}.png`;
    }
  }

  if (title.startsWith("Markdown/")) {
    const family = familyFromTitle(title);
    if (!family) return undefined;
    return `/visual-baselines/markdown/${family}/${storySlugFromId(id)}${VISUAL_BASELINE_SUFFIX}.png`;
  }

  if (title.startsWith("Default UI/")) {
    const family = familyFromTitle(title);
    if (!family) return undefined;
    return `/visual-baselines/default-ui/${family}/${storySlugFromId(id)}${VISUAL_BASELINE_SUFFIX}.png`;
  }

  return undefined;
}

export function visualBaselineVisualDeltaParameter(src: string) {
  return {
    images: [src],
    opacity: 0.5,
    colorInversion: false,
    align: "canvas" as const,
    placement: "right" as const,
    passThresholdPercent: 0.1,
  };
}
