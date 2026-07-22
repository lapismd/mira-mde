/**
 * Nested visual baseline paths mirror `stories/<…>/` feature folders.
 *
 * Example:
 *   importPath: ./stories/markdown/callouts/Callouts.stories.svelte
 *   storyId:    markdown-callouts--preview
 *   →           markdown/callouts/preview.png
 * Playwright then appends `-chromium-darwin`.
 */

export type StoryIndexEntry = {
  id: string;
  type?: string;
  name?: string;
  title?: string;
  importPath?: string;
  tags?: string[];
};

/** Directory under the snapshot root for a Storybook entry (posix separators). */
export function snapshotDirFromImportPath(importPath: string): string {
  const normalized = importPath.replace(/\\/g, "/");
  const stripped = normalized.replace(/^\.\//, "").replace(/^stories\//, "");
  // markdown/callouts/Callouts.stories.svelte → markdown/callouts
  return stripped.replace(/\/[^/]+\.stories\.\w+$/, "");
}

export function storySlugFromId(storyId: string): string {
  const parts = storyId.split("--");
  if (parts.length < 2) {
    throw new Error(`Unexpected story id (missing --): ${storyId}`);
  }
  return parts.slice(1).join("--");
}

/** Relative path passed to `toHaveScreenshot` (no project/platform suffix). */
export function screenshotRelativePath(entry: StoryIndexEntry): string {
  if (!entry.importPath) {
    throw new Error(`Story ${entry.id} is missing importPath`);
  }
  const dir = snapshotDirFromImportPath(entry.importPath);
  const slug = storySlugFromId(entry.id);
  return `${dir}/${slug}.png`;
}

/**
 * Nested path after Playwright appends `-{project}-{platform}` before `.png`.
 * Defaults match the chromium/darwin layout used in this repo.
 */
export function nestedSnapshotFileName(
  entry: StoryIndexEntry,
  project = "chromium",
  platform: NodeJS.Platform | string = "darwin",
): string {
  const rel = screenshotRelativePath(entry);
  return rel.replace(/\.png$/, `-${project}-${platform}.png`);
}

/** Storybook story-id prefix for `-g` filtering, e.g. `markdown-callouts--`. */
export function storyIdPrefixFromTitle(storyTitle: string): string {
  const slug = storyTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug}--`;
}

/** Prefix used for `-g` from a full story id (`markdown-callouts--preview`). */
export function storyIdPrefixFromStoryId(storyId: string): string {
  const head = storyId.split("--")[0]?.trim();
  if (!head) {
    throw new Error(`Unexpected story id (empty): ${storyId}`);
  }
  return `${head}--`;
}

/** Component folder match for nested keys like `markdown/callouts/foo-chromium-darwin.png`. */
export function snapshotKeyMatchesComponent(
  key: string,
  component: string,
  extraIncludes: string[] = [],
): boolean {
  const needle = component.toLowerCase().replace(/\s+/g, "-");
  const normalized = key.replace(/\\/g, "/");
  if (normalized.includes(`markdown/${needle}/`)) return true;
  if (normalized.includes(`default-ui/${needle}/`)) return true;
  for (const inc of extraIncludes) {
    if (normalized.includes(inc)) return true;
  }
  if (normalized.includes(`-${needle}--`)) return true;
  if (normalized.startsWith(`${needle}-`)) return true;
  return false;
}
