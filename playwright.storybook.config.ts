import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/storybook",
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://127.0.0.1:7007",
    trace: "on-first-retry",
  },
  webServer: {
    command: "STORYBOOK_PORT=7007 pnpm storybook --ci",
    url: "http://127.0.0.1:7007",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
