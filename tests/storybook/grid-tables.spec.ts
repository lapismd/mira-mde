import { expect, test, type Locator, type Page } from "@playwright/test";

async function gotoStory(page: Page, id: string): Promise<void> {
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await expect(page.locator("#storybook-root")).toBeVisible();
}

async function expectMonospacedGridLine(line: Locator): Promise<void> {
  const metrics = await line.evaluate((element) => {
    const ownerDocument = element.ownerDocument;
    const probe = ownerDocument.createElement("span");
    probe.style.fontFamily = "var(--font-monospace)";
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    element.append(probe);
    const monoFontFamily = getComputedStyle(probe).fontFamily;
    probe.remove();
    const style = getComputedStyle(element);
    return {
      fontFamily: style.fontFamily,
      monoFontFamily,
      whiteSpace: style.whiteSpace,
    };
  });

  expect(metrics.fontFamily).toBe(metrics.monoFontFamily);
  expect(metrics.whiteSpace).toBe("pre");
}

test("source grid tables format and move to the next cell on Tab", async ({
  page,
}) => {
  await gotoStory(page, "markdown-grid-tables--source-mode");

  const editor = page.getByRole("textbox", { name: "Markdown editor" });
  const gridLines = page.locator(".cm-line.cm-formatting-grid-table");
  await expect(gridLines).toHaveCount(19);
  await expectMonospacedGridLine(gridLines.first());

  await editor.click();
  await editor.press(process.platform === "darwin" ? "Meta+f" : "Control+f");
  const find = page.getByRole("textbox", { name: "Find" });
  await find.fill("Table Headings");
  await find.press("Enter");
  await find.press("Escape");
  await expect
    .poll(() => page.evaluate(() => window.getSelection()?.toString()))
    .toBe("Table Headings");

  await editor.press("Tab");

  await expect
    .poll(() => page.evaluate(() => window.getSelection()?.toString().trim()))
    .toBe("Here");
  const markdown = await page
    .locator("[data-markdown-value]")
    .getAttribute("data-markdown-value");
  expect(markdown).toMatch(/^\| Table Headings\s+\| Here\s+\|$/m);
  expect(markdown).not.toMatch(/^\s+\| Table Headings/m);
  await expect.poll(() => gridLines.count()).toBeGreaterThanOrEqual(19);
});

test("live-preview grid-table source fallback remains monospaced", async ({
  page,
}) => {
  await gotoStory(page, "markdown-grid-tables--live-preview");

  await page.getByRole("button", { name: "Edit table source" }).click();
  const gridLines = page.locator(".cm-line.cm-formatting-grid-table");
  await expect(gridLines).toHaveCount(19);
  await expectMonospacedGridLine(gridLines.first());
});
