import { expect, test, type Locator, type Page } from "@playwright/test";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { compareBaselineToActualPng } from "../../scripts/visual/compare-pixels.js";
import {
  actualPngPath,
  baselinePngPath,
  buildSidecarBase,
  diffPngPath,
  sidecarJsonPath,
  snapshotPublicRel,
  writeVisualDiffSidecar,
} from "../../scripts/visual/diff-result.js";
import {
  screenshotRelativePath,
  type StoryIndexEntry,
} from "../../scripts/visual/snapshot-paths.js";

type StorybookIndex = {
  entries: Record<string, StoryIndexEntry>;
};

const PORTAL_SELECTORS = [
  '[role="dialog"]',
  '[role="listbox"]',
  '[role="menu"]',
  '[data-state="open"]',
].join(", ");

const PACKAGE_ROOT = resolve(".");
const isBaselineUpdate = process.env.PLAYWRIGHT_UPDATE_SNAPSHOTS === "1";

const screenshotExpectationOptions = isBaselineUpdate
  ? { maxDiffPixelRatio: 0 }
  : {};

function loadVisualStories(): StoryIndexEntry[] {
  const indexPath = resolve("storybook-static/index.json");
  const index = JSON.parse(readFileSync(indexPath, "utf8")) as StorybookIndex;
  return Object.values(index.entries)
    .filter((entry) => entry.type === "story")
    .filter((entry) => !(entry.tags ?? []).includes("skip-visual"))
    .sort((a, b) => a.id.localeCompare(b.id));
}

function looksLikePortalStory(storyId: string): boolean {
  return (
    storyId.includes("open-menu") ||
    storyId.includes("--open-") ||
    storyId.includes("dialog") ||
    storyId.includes("popover")
  );
}

async function portalUnionClip(
  page: Page,
): Promise<{ x: number; y: number; width: number; height: number } | null> {
  return page.evaluate((portalSelector) => {
    const root = document.querySelector("#storybook-root");
    if (!root) return null;
    const rects: DOMRect[] = [root.getBoundingClientRect()];
    for (const el of document.querySelectorAll(portalSelector)) {
      if (!(el instanceof HTMLElement)) continue;
      if (root.contains(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") continue;
      rects.push(r);
    }
    if (rects.length < 2) return null;
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    for (const r of rects) {
      left = Math.min(left, r.left);
      top = Math.min(top, r.top);
      right = Math.max(right, r.right);
      bottom = Math.max(bottom, r.bottom);
    }
    const x = Math.max(0, Math.floor(left));
    const y = Math.max(0, Math.floor(top));
    const width = Math.ceil(right - left);
    const height = Math.ceil(bottom - top);
    if (width < 1 || height < 1) return null;
    return { x, y, width, height };
  }, PORTAL_SELECTORS);
}

async function captureActualPng(
  page: Page,
  subject: Locator | null,
  clip: { x: number; y: number; width: number; height: number } | null,
): Promise<Buffer> {
  if (clip) {
    return page.screenshot({
      clip,
      animations: "disabled",
      caret: "hide",
      scale: "device",
      type: "png",
    });
  }
  if (subject) {
    return subject.screenshot({
      animations: "disabled",
      caret: "hide",
      scale: "device",
      type: "png",
    });
  }
  return page.screenshot({
    animations: "disabled",
    caret: "hide",
    scale: "device",
    type: "png",
  });
}

function writeSidecarForStory(
  story: StoryIndexEntry,
  status: "passed" | "failed",
  error: string | undefined,
  actualPng: Buffer | null,
): void {
  const baselinePath = baselinePngPath(story, PACKAGE_ROOT);
  const outPath = sidecarJsonPath(baselinePath);
  const base = buildSidecarBase(story, status, error);
  if (!actualPng || !existsSync(baselinePath)) {
    writeVisualDiffSidecar(outPath, base);
    return;
  }
  try {
    const {
      actualPng: fittedActual,
      diffPng,
      ...metrics
    } = compareBaselineToActualPng(baselinePath, actualPng);
    const actualPath = actualPngPath(baselinePath);
    const heatmapPath = diffPngPath(baselinePath);
    writeFileSync(actualPath, fittedActual);
    writeFileSync(heatmapPath, diffPng);
    writeVisualDiffSidecar(outPath, {
      ...base,
      ...metrics,
      actualRel: snapshotPublicRel(actualPath, PACKAGE_ROOT),
      diffRel: snapshotPublicRel(heatmapPath, PACKAGE_ROOT),
    });
  } catch {
    writeVisualDiffSidecar(outPath, base);
  }
}

const stories = loadVisualStories();

test.describe("Storybook visual baselines", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const style = document.createElement("style");
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          caret-color: transparent !important;
        }
      `;
      document.documentElement.appendChild(style);
    });
  });

  for (const story of stories) {
    const storyId = story.id;
    test(storyId, async ({ page }) => {
      await page.goto(`/iframe.html?id=${storyId}&viewMode=story`, {
        waitUntil: "networkidle",
      });

      const root = page.locator("#storybook-root");
      await expect(root).toBeVisible();
      await page.evaluate(async () => {
        if (document.fonts?.ready) {
          await document.fonts.ready;
        }
      });

      await page
        .waitForFunction(
          () =>
            !document.querySelector(
              ".sb-show-preparing-story, .sb-show-preparing-docs",
            ),
          undefined,
          { timeout: 10_000 },
        )
        .catch(() => {
          /* still screenshot */
        });

      // Mermaid / KaTeX may settle after first paint.
      await page.waitForTimeout(300);

      await page.evaluate(() => {
        const active = document.activeElement;
        if (active instanceof HTMLElement) active.blur();
      });

      const snapshotPath = screenshotRelativePath(story).split("/");

      let subject: Locator | null = null;
      let clip: { x: number; y: number; width: number; height: number } | null =
        null;

      let status: "passed" | "failed" = "passed";
      let error: string | undefined;
      try {
        const usePortalClip =
          looksLikePortalStory(storyId) ||
          (await page.locator(PORTAL_SELECTORS).count()) > 0;
        clip = usePortalClip ? await portalUnionClip(page) : null;
        if (!clip) {
          const childCount = await root.locator(":scope > *").count();
          subject = childCount > 0 ? root.locator(":scope > *").first() : root;
          await expect(subject).toBeVisible();
        }
        if (clip) {
          await expect(page).toHaveScreenshot(snapshotPath, {
            clip,
            ...screenshotExpectationOptions,
          });
        } else {
          await expect(subject!).toHaveScreenshot(
            snapshotPath,
            screenshotExpectationOptions,
          );
        }
      } catch (err) {
        status = "failed";
        error = err instanceof Error ? err.message : String(err);
        throw err;
      } finally {
        const actualPng = await captureActualPng(page, subject, clip).catch(
          () => null,
        );
        writeSidecarForStory(story, status, error, actualPng);
      }
    });
  }
});
