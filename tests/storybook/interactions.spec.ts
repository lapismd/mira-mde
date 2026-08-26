import { expect, test, type Locator, type Page } from "@playwright/test";

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

async function gotoStory(page: Page, id: string) {
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await expect(page.locator("#storybook-root")).toBeVisible();
}

function editorScroller(page: Page) {
  return page
    .locator(
      ".mira__editor-host > .mira-code-editor__host > .cm-editor > .cm-scroller",
    )
    .first();
}

async function scrollEditorUntilVisible(
  page: Page,
  locator: Locator,
  max = 10_000,
) {
  const scroller = editorScroller(page);
  for (let top = 0; top <= max; top += 400) {
    await scroller.evaluate((element, nextTop) => {
      element.scrollTop = nextTop;
      element.dispatchEvent(new Event("scroll"));
    }, top);
    if ((await locator.count()) > 0 && (await locator.first().isVisible())) {
      return;
    }
  }
  await expect(locator.first()).toBeVisible();
}

async function tableShape(widget: Locator) {
  return widget.evaluate((element) => {
    const table = element.querySelector<HTMLElement>(".cm-table-widget");
    return {
      columns:
        table?.querySelectorAll('[data-markdown-table-chrome="col-header"]')
          .length ?? 0,
      rows: table?.querySelectorAll("tbody tr").length ?? 0,
    };
  });
}

test("the CodeMirror scroller owns comprehensive live-preview overflow", async ({
  page,
}) => {
  await gotoStory(page, "demo-comprehensive--live-preview");

  const scroller = editorScroller(page);
  const shell = page.locator(".mira__editor-scroll").first();
  const metrics = await scroller.evaluate((element) => ({
    clientHeight: element.clientHeight,
    overflowY: getComputedStyle(element).overflowY,
    scrollHeight: element.scrollHeight,
  }));
  expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
  expect(["auto", "scroll", "overlay"]).toContain(metrics.overflowY);

  const shellMetrics = await shell.evaluate((element) => ({
    clientHeight: element.clientHeight,
    overflowY: getComputedStyle(element).overflowY,
    scrollHeight: element.scrollHeight,
  }));
  expect(shellMetrics.overflowY).toBe("hidden");
  expect(shellMetrics.scrollHeight).toBeLessThanOrEqual(
    shellMetrics.clientHeight + 1,
  );

  await scroller.evaluate((element) => {
    element.scrollTop = 800;
    element.dispatchEvent(new Event("scroll"));
  });
  await expect
    .poll(() => scroller.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
});

test("the comprehensive reading story renders its grid and callout gallery", async ({
  page,
}) => {
  await gotoStory(page, "demo-comprehensive--reading-preview");

  const preview = page
    .locator(
      ".markdown-preview-surface--reading:not(.markdown-preview-surface--embedded)",
    )
    .first();
  const grid = preview.locator("table").filter({
    hasText: "column spanning",
  });
  await expect(grid).toBeVisible();
  await expect(grid.locator("tr")).toHaveCount(6);

  const callouts = preview.locator(".callout");
  await expect(callouts).toHaveCount(16);
  await expect(
    preview.locator(".callout[data-callout='abstract']"),
  ).toContainText("Abstract, Summary, Tldr");
  const gallery = await callouts.evaluateAll((elements) =>
    elements.slice(-12).map((element) => ({
      backgroundColor: getComputedStyle(element).backgroundColor,
      type: element.getAttribute("data-callout"),
    })),
  );
  expect(gallery.map(({ type }) => type)).toEqual([
    "note",
    "abstract",
    "info",
    "tip",
    "success",
    "question",
    "warning",
    "failure",
    "danger",
    "bug",
    "example",
    "quote",
  ]);
  expect(
    gallery.every(
      ({ backgroundColor }) => backgroundColor !== "rgba(0, 0, 0, 0)",
    ),
  ).toBe(true);
});

test("the comprehensive live-preview callout gallery keeps painted gaps", async ({
  page,
}) => {
  await gotoStory(page, "demo-comprehensive--live-preview");

  const abstractCallout = page
    .locator(".callout[data-callout='abstract']")
    .filter({ hasText: "Abstract, Summary, Tldr" });
  await scrollEditorUntilVisible(page, abstractCallout);

  const gallery = page.locator(".callout");
  await expect(gallery).toHaveCount(12);
  const geometry = await gallery.evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element);
      const widget = element.closest<HTMLElement>(".mira-rich-widget");
      const widgetStyle = widget ? getComputedStyle(widget) : null;
      return {
        backgroundClip: style.backgroundClip,
        borderTopWidth: Number.parseFloat(style.borderTopWidth),
        marginBottom: Number.parseFloat(style.marginBottom),
        marginTop: Number.parseFloat(style.marginTop),
        widgetMarginBottom: Number.parseFloat(widgetStyle?.marginBottom ?? "0"),
        widgetMarginTop: Number.parseFloat(widgetStyle?.marginTop ?? "0"),
      };
    }),
  );

  expect(
    geometry
      .slice(1)
      .every(({ backgroundClip }) => backgroundClip === "padding-box"),
  ).toBe(true);
  expect(
    geometry.slice(1).every(({ borderTopWidth }) => borderTopWidth >= 4),
  ).toBe(true);
  expect(
    geometry.every(
      ({ marginBottom, marginTop, widgetMarginBottom, widgetMarginTop }) =>
        marginBottom === 0 &&
        marginTop === 0 &&
        widgetMarginBottom === 0 &&
        widgetMarginTop === 0,
    ),
  ).toBe(true);
});

test("the comprehensive split story synchronizes both scroll owners", async ({
  page,
}) => {
  await gotoStory(page, "demo-comprehensive--split");

  const editor = editorScroller(page);
  const preview = page
    .locator(".mira__pane--preview .mira-markdown-preview")
    .first();
  await expect(preview).toBeVisible();
  await expect(
    page.getByRole("group", { name: "Document outline" }),
  ).toBeVisible();

  await editor.evaluate((element) => {
    element.scrollTop = 1_600;
    element.dispatchEvent(new Event("scroll"));
  });
  await expect
    .poll(() => preview.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);

  await preview.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
    element.dispatchEvent(new Event("scroll"));
  });
  await expect
    .poll(() => editor.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(1_600);
});

test("the reading outline remains visible and navigates its preview scroller", async ({
  page,
}) => {
  await gotoStory(page, "markdown-headings--outline-navigation");

  const pane = page.locator(".mira__pane--outline-floating");
  const preview = pane.locator(".mira-markdown-preview");
  const outline = pane.getByRole("group", { name: "Document outline" });
  const marker = outline.getByRole("button", {
    name: "Open outline and scroll to Heading 4",
  });
  const target = preview.getByRole("heading", { name: "Heading 4" });

  await expect(pane).toBeVisible();
  await expect(preview).toBeVisible();
  await expect(outline).toBeVisible();
  await expect(target).toHaveAttribute("id", "heading-4");

  const collapsedLayout = await pane.evaluate((element) => {
    const outlineElement = element.querySelector(".mira-markdown-outline");
    const paneRect = element.getBoundingClientRect();
    const outlineRect = outlineElement?.getBoundingClientRect();
    return {
      outlinePosition: outlineElement
        ? getComputedStyle(outlineElement).position
        : null,
      outlineInsidePane:
        Boolean(outlineRect) &&
        outlineRect!.top >= paneRect.top &&
        outlineRect!.bottom <= paneRect.bottom &&
        outlineRect!.right <= paneRect.right &&
        outlineRect!.right >= paneRect.right - 32,
    };
  });
  expect(collapsedLayout.outlinePosition).toBe("absolute");
  expect(collapsedLayout.outlineInsidePane).toBe(true);

  await marker.click();
  const panel = outline.getByRole("navigation", { name: "Table of contents" });
  await expect(panel).toBeVisible();
  await expect(panel.getByText("On this page")).toBeVisible();
  await expect(marker).toHaveAttribute("aria-current", "true");
  await expect
    .poll(() => preview.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  await expect(target).toBeFocused();
});

test("table chrome supports pointer reordering, mutation, and source reveal", async ({
  page,
}) => {
  await gotoStory(page, "demo-comprehensive--live-preview");

  const widget = page
    .locator(".mira-rich-widget--table")
    .filter({ hasText: "@lapismd/mira/core" })
    .first();
  await scrollEditorUntilVisible(page, widget);
  const rows = widget.locator("tbody tr");
  await expect(rows).toHaveCount(5);

  const rowBefore = await rows.nth(1).innerText();
  const nextRowBefore = await rows.nth(2).innerText();
  const sourceGutter = rows
    .nth(1)
    .locator('[data-markdown-table-chrome="row-gutter"]');
  const targetGutter = rows
    .nth(2)
    .locator('[data-markdown-table-chrome="row-gutter"]');
  await sourceGutter.hover();
  const sourceHandle = sourceGutter.locator(
    '[data-markdown-table-drag-handle="row"]',
  );
  await expect(sourceHandle).toBeVisible();
  const sourceBox = await sourceHandle.boundingBox();
  const targetBox = await targetGutter.boundingBox();
  expect(sourceBox).not.toBeNull();
  expect(targetBox).not.toBeNull();

  await page.mouse.move(
    sourceBox!.x + sourceBox!.width / 2,
    sourceBox!.y + sourceBox!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(sourceBox!.x + sourceBox!.width / 2 + 8, sourceBox!.y, {
    steps: 3,
  });
  await page.mouse.move(
    targetBox!.x + targetBox!.width / 2,
    targetBox!.y + targetBox!.height / 2,
    { steps: 12 },
  );
  await page.mouse.up();

  await expect.poll(() => rows.nth(1).innerText()).toContain(nextRowBefore);
  await expect.poll(() => rows.nth(2).innerText()).toContain(rowBefore);

  const beforeMutation = await tableShape(widget);
  const addRow = widget.locator(
    '[data-markdown-table-chrome="add-row"] button',
  );
  await addRow.hover();
  await addRow.click();
  await expect
    .poll(() => tableShape(widget))
    .toEqual({
      columns: beforeMutation.columns,
      rows: beforeMutation.rows + 1,
    });

  const addColumn = widget.locator(
    '[data-markdown-table-chrome="add-col"] button',
  );
  await addColumn.hover();
  await addColumn.click();
  await expect
    .poll(() => tableShape(widget))
    .toEqual({
      columns: beforeMutation.columns + 1,
      rows: beforeMutation.rows + 1,
    });

  await widget.getByRole("button", { name: "Edit table source" }).click();
  await expect(widget).toHaveCount(0);
  await expect(
    editorScroller(page).locator(":scope > .cm-content"),
  ).toContainText("@lapismd/mira/core");
});

test("live-preview code copy uses the browser clipboard", async ({ page }) => {
  await gotoStory(page, "markdown-code--live-preview");

  const widget = page.locator(".mira-rich-widget--fencedcode").first();
  await expect(widget).toBeVisible();
  await widget.hover();
  await widget.getByRole("button", { name: "Copy code" }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain('type EditorMode = "source"');
});

test("the Mermaid dialog settles inside its Storybook iframe", async ({
  page,
}) => {
  await gotoStory(page, "markdown-mermaid--preview");

  const dialog = page.getByRole("dialog", { name: "Mermaid diagram" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".mermaid svg").first()).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Zoom in" })).toBeVisible();

  const box = await dialog.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height);
});
