import { expect, test, type Page } from "@playwright/test";

const modeValues: Record<string, string> = {
  Live: "live-preview",
  Preview: "preview",
  Source: "source",
  Split: "split",
};

async function gotoDemo(page: Page) {
  await page.goto("/");
  await expect(
    page.locator(
      '.mira-default-toolbar__event-root[data-mira-toolbar-delegate="ready"]',
    ),
  ).toBeVisible();
  await expect(page.locator(".mira-mde")).toHaveAttribute(
    "data-mode",
    "live-preview",
  );
  await expect(
    page.locator(".demo-toolbar").getByRole("button", { name: "View mode" }),
  ).toBeVisible();
  await expect(
    page
      .locator(".demo-toolbar")
      .getByRole("button", { name: "Demo settings" }),
  ).toBeVisible();
  await expect(
    page.locator(".demo-toolbar").getByRole("button", { name: "Split" }),
  ).toBeVisible();
  await expect(
    page.locator(".demo-toolbar").getByRole("button", { name: "Obsidian" }),
  ).toHaveCount(0);
  await expect
    .poll(() =>
      page
        .locator(".demo-main")
        .evaluate((element) => getComputedStyle(element).padding),
    )
    .toBe("0px");
  await expect
    .poll(() =>
      page.locator(".demo-editor").evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          borderWidth: style.borderTopWidth,
          borderRadius: style.borderTopLeftRadius,
        };
      }),
    )
    .toEqual({ borderWidth: "0px", borderRadius: "0px" });
}

async function setMode(page: Page, name: keyof typeof modeValues) {
  const expectedMode = modeValues[name];
  const currentMode = await page.locator(".mira-mde").getAttribute("data-mode");

  if (currentMode === expectedMode) {
    return;
  }

  const toolbar = page.locator(".demo-toolbar");

  if (name === "Split") {
    await toolbar.getByRole("button", { name: "Split", exact: true }).click();
  } else if (name === "Live") {
    const editButton = toolbar.getByRole("button", {
      name: "Edit",
      exact: true,
    });
    if ((await editButton.count()) > 0) {
      await editButton.click();
    } else {
      await toolbar.getByRole("button", { name: "View mode" }).click();
      await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
    }
  } else {
    if (currentMode === "preview") {
      await setMode(page, "Live");
    }
    await toolbar.getByRole("button", { name: "View mode" }).click();
    await page
      .getByRole("menuitem", {
        name: name === "Source" ? "Source mode" : "Preview",
        exact: true,
      })
      .click();
  }

  await expect(page.locator(".mira-mde")).toHaveAttribute(
    "data-mode",
    expectedMode,
  );
}

async function scrollEditor(page: Page, top: number) {
  await page
    .locator(".mira-mde__editor-host > .cm-editor > .cm-scroller")
    .first()
    .evaluate((element, nextTop) => {
      element.scrollTop = nextTop;
      element.dispatchEvent(new Event("scroll"));
    }, top);
}

function editorContent(page: Page) {
  return page
    .locator(".mira-mde__editor-host > .cm-editor > .cm-scroller .cm-content")
    .first();
}

test("live preview renders widgets and editable frontmatter updates markdown", async ({
  page,
}) => {
  await gotoDemo(page);
  await setMode(page, "Live");

  await expect(page.locator(".cm-live-preview")).toBeVisible();
  const frontmatterWidget = page.locator(".mira-rich-widget--frontmatter");
  await expect(frontmatterWidget).toBeVisible();
  await expect(
    frontmatterWidget.getByRole("button", { name: "Collapse properties" }),
  ).toBeVisible();
  await frontmatterWidget
    .getByRole("button", { name: "Collapse properties" })
    .click();
  await expect(frontmatterWidget.locator(".mira-frontmatter")).toHaveCount(0);
  await frontmatterWidget
    .getByRole("button", { name: "Expand properties" })
    .click();
  await expect(frontmatterWidget.locator(".mira-frontmatter")).toBeVisible();
  await expect
    .poll(() =>
      frontmatterWidget.evaluate((element) => {
        const widget = element.getBoundingClientRect();
        const frontmatter = element
          .querySelector<HTMLElement>(".mira-frontmatter")
          ?.getBoundingClientRect();
        return frontmatter ? frontmatter.width / widget.width : 0;
      }),
    )
    .toBeGreaterThan(0.9);
  await expect
    .poll(() =>
      frontmatterWidget.evaluate((element) => {
        const trigger = element.querySelector<HTMLElement>(
          ".md-frontmatter__trigger",
        );
        const content = element.querySelector<HTMLElement>(
          ".md-frontmatter__content",
        );
        if (!trigger || !content) {
          return Number.POSITIVE_INFINITY;
        }
        return (
          content.getBoundingClientRect().top -
          trigger.getBoundingClientRect().bottom
        );
      }),
    )
    .toBeLessThan(1);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const content = document.querySelector<HTMLElement>(
          ".mira-rich-widget--frontmatter .md-frontmatter__content",
        );
        const heading = document.querySelector<HTMLElement>(
          ".cm-line.cm-header-1",
        );
        if (!content || !heading) {
          return Number.POSITIVE_INFINITY;
        }
        return (
          heading.getBoundingClientRect().top -
          content.getBoundingClientRect().bottom
        );
      }),
    )
    .toBeLessThan(4);

  const titleInput = page
    .locator('.metadata-property[data-property="title"]')
    .locator("input");
  await expect(titleInput).toHaveValue("Mira MDE Demo");
  await expect(
    page.locator(
      '.metadata-property[data-property="tags"] .metadata-property-icon svg',
    ),
  ).toBeVisible();
  const tagsProperty = page.locator('.metadata-property[data-property="tags"]');
  await expect(tagsProperty.locator(".metadata-property-pill-chip")).toHaveText(
    ["markdown", "editor"],
  );
  await expect(tagsProperty.locator(".metadata-input-list")).toHaveValue("");
  await tagsProperty.locator(".metadata-property-pill-chip").first().hover();
  await expect(
    tagsProperty.getByRole("button", { name: "Remove markdown" }),
  ).toBeVisible();
  await tagsProperty.getByRole("button", { name: "Remove markdown" }).click();
  await titleInput.fill("Edited Mira Demo");
  await titleInput.blur();

  await setMode(page, "Source");
  await scrollEditor(page, 0);
  await expect(editorContent(page)).toContainText("title: Edited Mira Demo");
  await expect(editorContent(page)).not.toContainText("  - markdown");
});

test("clicking a live-preview block restores editable source", async ({
  page,
}) => {
  await gotoDemo(page);
  await setMode(page, "Live");

  const fencedWidget = page
    .locator(".mira-rich-widget--fencedcode")
    .filter({ has: page.locator(".mermaid") })
    .first();
  await scrollEditor(page, 1500);
  await expect(fencedWidget).toBeVisible();
  await fencedWidget.hover();
  await fencedWidget.locator(".mira-rich-widget__source-toggle").click();

  await expect(editorContent(page)).toContainText("~~~mermaid");
  await expect(editorContent(page)).toContainText("flowchart LR");
});

test("inline fold controls, Source Code Pro, and Obsidian tokens are present", async ({
  page,
}) => {
  await gotoDemo(page);
  await setMode(page, "Source");

  const foldButton = page
    .locator(".cm-fold-indicator .collapse-indicator")
    .first();
  await expect(foldButton).toBeVisible();
  await expect(foldButton.locator(".svg-icon")).toBeVisible();
  await expect(foldButton.locator(".svg-icon")).toHaveText("");
  await foldButton.click();
  await expect(foldButton).toHaveAttribute("aria-label", "Expand section");

  const fontFamily = await page
    .locator(".cm-scroller")
    .evaluate((element) => getComputedStyle(element).fontFamily);
  expect(fontFamily.toLowerCase()).toContain("source code pro");

  const monoToken = await page
    .locator(".mira-mde")
    .evaluate((element) =>
      getComputedStyle(element).getPropertyValue("--mira-font-mono"),
    );
  expect(monoToken).toContain("Source Code Pro");
});

test("task lists and live heading gutters match Lapis styling", async ({
  page,
}) => {
  await gotoDemo(page);

  await setMode(page, "Preview");
  const previewTask = page
    .locator(".mira-markdown-preview li.task-list-item")
    .first();
  await expect(previewTask).toBeVisible();
  await expect(previewTask.locator(".task-list-item-checkbox")).toBeVisible();
  await expect
    .poll(() =>
      previewTask.evaluate(
        (element) => getComputedStyle(element).listStyleType,
      ),
    )
    .toBe("none");

  await setMode(page, "Live");
  await scrollEditor(page, 0);
  await expect(page.locator(".cm-line.cm-header-1")).toBeVisible();
  await expect(
    page.locator(".cm-content .mira-inline-math-widget .katex").first(),
  ).toBeVisible();
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const header = document.querySelector<HTMLElement>(
          ".cm-line.cm-header-1",
        );
        const gutter =
          document.querySelector<HTMLElement>(".cm-gutterHeader-1");
        if (!header || !gutter) {
          return false;
        }
        return (
          getComputedStyle(header).lineHeight ===
            getComputedStyle(gutter).lineHeight &&
          Math.abs(
            header.getBoundingClientRect().top -
              gutter.getBoundingClientRect().top,
          ) < 1
        );
      }),
    )
    .toBe(true);
  const headingMetrics = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>(".cm-line.cm-header-1")!;
    const gutter = document.querySelector<HTMLElement>(".cm-gutterHeader-1")!;
    return {
      headerLineHeight: getComputedStyle(header).lineHeight,
      gutterLineHeight: getComputedStyle(gutter).lineHeight,
      topDelta: Math.abs(
        header.getBoundingClientRect().top - gutter.getBoundingClientRect().top,
      ),
    };
  });
  expect(headingMetrics.gutterLineHeight).toBe(headingMetrics.headerLineHeight);
  expect(headingMetrics.topDelta).toBeLessThan(1);

  await scrollEditor(page, 650);
  const liveTask = page.locator(".HyperMD-task-line").first();
  await expect(liveTask).toBeVisible();
  await expect(liveTask.locator(".mira-task-checkbox")).toBeVisible();
  await expect(liveTask).not.toContainText("- [x]");
  await expect
    .poll(() =>
      liveTask.evaluate((element) => {
        const spans = element.querySelectorAll<HTMLElement>("span");
        const content = spans[spans.length - 1] ?? element;
        return getComputedStyle(content).textDecorationLine;
      }),
    )
    .toBe("none");
});

test("preview mode showcases the supported Markdown feature set", async ({
  page,
}) => {
  await gotoDemo(page);
  await setMode(page, "Preview");

  const preview = page.locator(".mira-markdown-preview");
  await expect(preview.locator("del").first()).toContainText("strikethrough");
  await expect(
    preview.locator("code").filter({ hasText: "inline code" }),
  ).toBeVisible();
  await expect(
    preview.locator("a[data-mira-internal-link]").first(),
  ).toBeVisible();
  await expect(preview.locator(".mira-embed")).toContainText(
    "Architecture diagram embed",
  );
  await expect(
    preview.locator(".tag").filter({ hasText: "#mira/editor" }),
  ).toBeVisible();
  await expect(preview.locator(".katex").first()).toBeVisible();
  await expect(
    preview.locator('img[alt="Mira Markdown demo asset"]'),
  ).toBeVisible();
  await expect(preview.locator("mark")).toContainText("Raw HTML is preserved");
  await expect(preview.locator("kbd")).toContainText("keyboard");
  await expect(
    preview.locator('directive[data-directive="mira"]'),
  ).toContainText("Directive syntax is parsed");
  await expect(preview).toContainText(
    "Footnotes come from the shared GFM Markdown pipeline.",
  );
});

test("tables and admonition callouts render in preview and live-preview", async ({
  page,
}) => {
  await gotoDemo(page);

  await setMode(page, "Preview");
  await expect(page.locator(".mira-mde")).toBeVisible();
  await expect(
    page.locator(".mira-markdown-preview table").first(),
  ).toBeVisible();
  await expect(page.locator(".mira-markdown-preview th").first()).toHaveText(
    "Package",
  );
  const previewCallout = page
    .locator(".mira-markdown-preview .callout")
    .first();
  await expect(previewCallout).toHaveAttribute("data-callout", "note");
  await expect(previewCallout.locator(".callout-title-inner")).toHaveText(
    "Portable package boundary",
  );

  await setMode(page, "Live");
  await scrollEditor(page, 1050);
  const liveTable = page
    .locator(".mira-rich-widget--table .cm-table-widget")
    .first();
  await expect(liveTable).toBeVisible();
  await expect
    .poll(() =>
      liveTable.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return {
          display: getComputedStyle(element).display,
          height: rect.height,
          width: rect.width,
        };
      }),
    )
    .toEqual({
      display: "table",
      height: expect.any(Number),
      width: expect.any(Number),
    });
  const tableMetrics = await liveTable.evaluate((element) => {
    const dataCell = element.querySelector<HTMLElement>(
      "tbody td:not(.markdown-table-chrome)",
    );
    const inlineEditor = dataCell?.querySelector<HTMLElement>(
      ".cm-editor.mod-inline",
    );
    const cellButton = dataCell?.querySelector<HTMLElement>(
      ".table-cell-wrapper > button",
    );
    const bodyRow = element.querySelector<HTMLElement>("tbody tr");
    const edgeButton = element.querySelector<HTMLElement>(
      '[data-markdown-table-chrome="add-col"] button',
    );
    const edgeIcon = edgeButton?.querySelector<SVGElement>("svg");
    const rowHandle = element.querySelector<HTMLElement>(
      '[data-markdown-table-drag-handle="row"]',
    );
    const rowHandleIcon = rowHandle?.querySelector<SVGElement>("svg");
    const rect = (node?: Element | null) => {
      const box = node?.getBoundingClientRect();
      return { height: box?.height ?? 0, width: box?.width ?? 0 };
    };

    return {
      bodyRowBorderBottom: bodyRow
        ? getComputedStyle(bodyRow).borderBottomWidth
        : "",
      cellButtonBackground: cellButton
        ? getComputedStyle(cellButton).backgroundColor
        : "",
      dataCell: rect(dataCell),
      edgeButton: rect(edgeButton),
      edgeButtonBorderLeft: edgeButton
        ? getComputedStyle(edgeButton).borderLeftWidth
        : "",
      edgeIcon: rect(edgeIcon),
      inlineEditor: rect(inlineEditor),
      rowHandle: rect(rowHandle),
      rowHandleBorderLeft: rowHandle
        ? getComputedStyle(rowHandle).borderLeftWidth
        : "",
      rowHandleIcon: rect(rowHandleIcon),
    };
  });
  expect(tableMetrics.dataCell.height).toBeGreaterThan(37);
  expect(tableMetrics.dataCell.height).toBeLessThan(39);
  expect(tableMetrics.inlineEditor.height).toBeGreaterThan(21);
  expect(tableMetrics.inlineEditor.height).toBeLessThan(22);
  expect(tableMetrics.cellButtonBackground).toBe("rgba(0, 0, 0, 0)");
  expect(tableMetrics.bodyRowBorderBottom).toBe("0px");
  expect(tableMetrics.edgeButtonBorderLeft).toBe("0px");
  expect(tableMetrics.edgeButton.width).toBeCloseTo(20, 1);
  expect(tableMetrics.edgeIcon.width).toBeCloseTo(16, 1);
  expect(tableMetrics.rowHandleBorderLeft).toBe("0px");
  expect(tableMetrics.rowHandle.width).toBeCloseTo(8, 1);
  expect(tableMetrics.rowHandleIcon.width).toBeCloseTo(16, 1);
  await liveTable.hover();
  await expect(
    page
      .locator(".mira-rich-widget--table .markdown-widget-select-control")
      .first(),
  ).toBeVisible();
  await expect(
    page
      .locator(
        '.mira-rich-widget--table [data-markdown-table-drag-handle="row"]',
      )
      .first(),
  ).toBeVisible();
  await expect(
    page
      .locator(
        '.mira-rich-widget--table [data-markdown-table-chrome="row-gutter"] [data-slot="dropdown-menu-trigger"]',
      )
      .first(),
  ).toBeVisible();
  await expect(
    page
      .locator(
        '.mira-rich-widget--table [data-markdown-table-chrome="delete-table"]',
      )
      .first(),
  ).toBeVisible();
  const rowActions = page
    .locator(
      '.mira-rich-widget--table [data-markdown-table-chrome="row-gutter"] [data-slot="dropdown-menu-trigger"]',
    )
    .first();
  await rowActions.click();
  const rowMenu = page.locator('[data-slot="dropdown-menu-content"]').last();
  await expect(
    rowMenu.locator('[data-slot="dropdown-menu-item"]').first(),
  ).toBeVisible();
  await expect(rowMenu.locator('[data-slot="dropdown-menu-item"]')).toHaveCount(
    3,
  );
  await rowActions.click();
  await page.locator(".mira-rich-widget--table th").nth(1).hover();
  await expect(
    page
      .locator(
        '.mira-rich-widget--table [data-markdown-table-drag-handle="col"]',
      )
      .first(),
  ).toBeVisible();
  await expect(
    page
      .locator(
        '.mira-rich-widget--table [data-markdown-table-chrome="col-header"] [data-slot="dropdown-menu-trigger"]',
      )
      .first(),
  ).toBeVisible();
  const columnActions = page
    .locator(
      '.mira-rich-widget--table [data-markdown-table-chrome="col-header"] [data-slot="dropdown-menu-trigger"]',
    )
    .first();
  await columnActions.click();
  const columnMenu = page.locator('[data-slot="dropdown-menu-content"]').last();
  await expect(
    columnMenu.locator('[data-slot="dropdown-menu-item"]').first(),
  ).toBeVisible();
  await expect(
    columnMenu.locator('[data-slot="dropdown-menu-item"]'),
  ).toHaveCount(6);
  const liveCallout = page
    .locator(".mira-rich-widget--blockquote .callout")
    .first();
  await scrollEditor(page, 320);
  await expect(liveCallout).toHaveAttribute("data-callout", "note");
  await expect(liveCallout.locator(".callout-content")).toContainText(
    "The editor, preview renderer",
  );
});

test("Mermaid renders SVG in preview and live-preview modes", async ({
  page,
}) => {
  await gotoDemo(page);

  await setMode(page, "Preview");
  const previewSvg = page
    .locator(".mira-markdown-preview .mermaid > .mermaid svg")
    .first();
  await expect(previewSvg).toBeVisible();
  const previewBox = await previewSvg.boundingBox();
  expect(previewBox?.width ?? 0).toBeGreaterThan(20);
  expect(previewBox?.height ?? 0).toBeGreaterThan(20);

  await setMode(page, "Live");
  await scrollEditor(page, 1500);
  const liveSvg = page
    .locator(".mira-rich-widget--fencedcode .mermaid > .mermaid svg")
    .first();
  await expect(liveSvg).toBeVisible();
  const liveBox = await liveSvg.boundingBox();
  expect(liveBox?.width ?? 0).toBeGreaterThan(20);
  expect(liveBox?.height ?? 0).toBeGreaterThan(20);

  const mermaidWidget = page
    .locator(".mira-rich-widget--fencedcode .mermaid")
    .filter({
      has: page.locator('button[aria-label="Copy Mermaid source"]'),
    })
    .first();
  await mermaidWidget.hover();
  await expect(mermaidWidget.locator("button").first()).toBeVisible();
  await expect(
    mermaidWidget.getByRole("button", { name: "Copy Mermaid source" }),
  ).toBeVisible();
  await mermaidWidget.locator("button").first().click();
  await expect(page.locator('[data-slot="dialog-content"]')).toBeVisible();
  await expect(
    page.locator(".mermaid-viewer-control-panel .zoom-in"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.locator('[data-slot="dialog-content"]')).toHaveCount(0);
});

test("Mermaid extension toggle affects preview rendering", async ({ page }) => {
  await gotoDemo(page);
  await setMode(page, "Preview");
  await expect(page.locator(".mermaid svg").first()).toBeVisible();

  await page
    .locator(".demo-toolbar")
    .getByRole("button", { name: "Disable Mermaid" })
    .click();

  await expect(page.locator(".mermaid")).toHaveCount(0);
  await expect(page.locator("pre code.language-mermaid").first()).toBeVisible();
});
