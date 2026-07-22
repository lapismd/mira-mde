import { defineConfig, devices } from "@playwright/test";
import {
  VISUAL_DEVICE_SCALE_FACTOR,
  VISUAL_VIEWPORT,
} from "./scripts/visual/capture-config.js";

const port = 6007;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  updateSnapshots:
    process.env.PLAYWRIGHT_UPDATE_SNAPSHOTS === "1"
      ? process.env.PLAYWRIGHT_UPDATE_MODE === "missing"
        ? "missing"
        : "all"
      : "none",
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.01,
      scale: "device",
    },
  },
  use: {
    baseURL,
    locale: "en-GB",
    timezoneId: "Europe/London",
    colorScheme: "light",
    reducedMotion: "reduce",
    viewport: { ...VISUAL_VIEWPORT },
    deviceScaleFactor: VISUAL_DEVICE_SCALE_FACTOR,
    trace: "off",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { ...VISUAL_VIEWPORT },
        deviceScaleFactor: VISUAL_DEVICE_SCALE_FACTOR,
      },
    },
  ],
  webServer: {
    command: `python3 -m http.server ${port} --directory storybook-static`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
