import { expect, test, type FrameLocator, type Page } from "@playwright/test";

async function storybookPreview(page: Page, path: string) {
  await page.goto(`/?path=${path}&globals=theme:mira;colorMode:light`);
  const preview = page.frameLocator("#storybook-preview-iframe");
  await expect(preview.locator("html")).toHaveAttribute(
    "data-mira-theme",
    "mira",
  );
  await expect(preview.locator("html")).toHaveAttribute(
    "data-mira-color-mode",
    "light",
  );
  return preview;
}

async function selectObsidian(page: Page, preview: FrameLocator) {
  await page
    .getByRole("button", { name: "Mira palette Mira", exact: true })
    .click();
  await page.getByRole("option", { name: "Obsidian", exact: true }).click();
  await expect(preview.locator("html")).toHaveAttribute(
    "data-mira-theme",
    "obsidian",
  );
}

async function selectDark(page: Page, preview: FrameLocator) {
  await page
    .getByRole("switch", { name: "Switch to dark mode", exact: true })
    .click();
  await expect(preview.locator("html")).toHaveClass(/\bdark\b/);
  await expect(preview.locator("html")).toHaveAttribute(
    "data-mira-color-mode",
    "dark",
  );
}

test("manager globals theme the comprehensive demo without remounting", async ({
  page,
}) => {
  const preview = await storybookPreview(
    page,
    "/story/demo-comprehensive--live-preview",
  );
  const editor = preview.locator(".mira-editor");
  await expect(editor).toBeVisible();

  await selectObsidian(page, preview);
  await expect
    .poll(() =>
      editor.evaluate((element) => getComputedStyle(element).backgroundColor),
    )
    .toBe("rgb(255, 255, 255)");
  await expect
    .poll(() => editor.evaluate((element) => getComputedStyle(element).color))
    .toBe("rgb(34, 34, 34)");

  await selectDark(page, preview);
  await expect
    .poll(() =>
      editor.evaluate((element) => getComputedStyle(element).backgroundColor),
    )
    .toBe("rgb(30, 30, 30)");
  await expect
    .poll(() => editor.evaluate((element) => getComputedStyle(element).color))
    .toBe("rgb(218, 218, 218)");
});

test("manager palette and color mode globals also reach Docs pages", async ({
  page,
}) => {
  const preview = await storybookPreview(
    page,
    "/docs/mira-editor-themes--docs",
  );

  await selectObsidian(page, preview);
  await selectDark(page, preview);
  await expect(
    preview.getByRole("heading", { name: "Themes and color modes" }),
  ).toBeVisible();
});
