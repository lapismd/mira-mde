/** Shared schema for per-screenshot visual diff sidecars (Playwright + Storybook). */

export type VisualDiffSidecarStatus =
  | "passed"
  | "failed"
  | "skipped"
  | "timedOut";

export type VisualDiffChangeBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type VisualDiffSidecar = {
  version: 1;
  storyId: string;
  title?: string;
  snapshotRel: string;
  status: VisualDiffSidecarStatus;
  error?: string;
  generatedAt: string;
  tool: "playwright";
  imageWidth?: number;
  imageHeight?: number;
  diffPixels?: number;
  totalPixels?: number;
  diffPercent?: number;
  passThresholdPercent?: number;
  passed?: boolean;
  changeBounds?: VisualDiffChangeBounds | null;
  diffHistogram?: number[];
  actualRel?: string;
  diffRel?: string;
};

export const VISUAL_DIFF_HISTOGRAM_BINS = 32;

/** Playwright `maxDiffPixelRatio: 0.01` → 1% of pixels. */
export const PLAYWRIGHT_PASS_THRESHOLD_PERCENT = 1;
