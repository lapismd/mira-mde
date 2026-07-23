import { expect, test, type Locator, type Page } from "@playwright/test";

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
    page.locator(".demo-toolbar").getByRole("button", { name: "Reading view" }),
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
    page.locator(".demo-toolbar").getByRole("button", { name: "View options" }),
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
    if (currentMode === "preview") {
      await toolbar.getByRole("button", { name: "Edit", exact: true }).click();
    } else {
      await toolbar.getByRole("button", { name: "View options" }).click();
      await page
        .getByRole("menuitem", { name: "Live edit", exact: true })
        .click();
    }
  } else if (name === "Preview") {
    await toolbar
      .getByRole("button", { name: "Reading view", exact: true })
      .click();
  } else {
    await toolbar.getByRole("button", { name: "View options" }).click();
    await page
      .getByRole("menuitem", { name: "Source mode", exact: true })
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

async function scrollEditorUntilVisible(
  page: Page,
  locator: Locator,
  options: { max?: number; step?: number } = {},
) {
  const max = options.max ?? 6_000;
  const step = options.step ?? 400;

  for (let top = 0; top <= max; top += step) {
    await scrollEditor(page, top);
    if ((await locator.count()) > 0 && (await locator.first().isVisible())) {
      return;
    }
  }

  await expect(locator.first()).toBeVisible();
}

function editorContent(page: Page) {
  return page
    .locator(".mira-mde__editor-host > .cm-editor > .cm-scroller .cm-content")
    .first();
}

async function tableWidgetShape(widget: Locator) {
  return widget.evaluate((element) => {
    const table = element.querySelector<HTMLElement>(".cm-table-widget");
    return {
      cols:
        table?.querySelectorAll('[data-markdown-table-chrome="col-header"]')
          .length ?? 0,
      rendered: Boolean(table),
      rows: table?.querySelectorAll("tbody tr").length ?? 0,
    };
  });
}

async function expectTableWidgetShape(
  widget: Locator,
  expected: { cols: number; rows: number },
) {
  await expect
    .poll(() => tableWidgetShape(widget))
    .toEqual({ rendered: true, ...expected });
}

async function hiddenFormattingCount(
  page: Page,
  lineSnippet: string,
  token: string,
) {
  return page.evaluate(
    ({ lineSnippet, token }) => {
      const line = Array.from(
        document.querySelectorAll<HTMLElement>(".cm-line"),
      ).find((element) => element.textContent?.includes(lineSnippet));
      if (!line) {
        return -1;
      }
      return Array.from(
        line.querySelectorAll<HTMLElement>(".cm-formatting-hidden"),
      ).filter((element) => element.textContent?.includes(token)).length;
    },
    { lineSnippet, token },
  );
}

async function expectHiddenFormattingCount(
  page: Page,
  lineSnippet: string,
  token: string,
  count: number,
) {
  await expect
    .poll(() => hiddenFormattingCount(page, lineSnippet, token))
    .toBe(count);
}

async function expectHiddenFormattingCountBelow(
  page: Page,
  lineSnippet: string,
  token: string,
  count: number,
) {
  await expect
    .poll(() => hiddenFormattingCount(page, lineSnippet, token))
    .toBeLessThan(count);
}

test("live preview renders widgets and editable frontmatter updates markdown", async ({
  page,
}) => {
  await gotoDemo(page);
  await setMode(page, "Live");

  await expect(page.locator(".cm-live-preview")).toBeVisible();
  const frontmatterWidget = page.locator(".mira-rich-widget--frontmatter");
  await expect(frontmatterWidget).toBeVisible();
  await expect(page.locator(".cm-editor").first()).toHaveClass(
    /mira-mde-live-preview-hide-cursor/,
  );
  await expect
    .poll(() =>
      page
        .locator(".cm-editor")
        .first()
        .evaluate((element) => {
          const cursorLayer =
            element.querySelector<HTMLElement>(".cm-cursorLayer");
          return cursorLayer ? getComputedStyle(cursorLayer).visibility : "";
        }),
    )
    .toBe("hidden");
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
    .locator('[aria-label="title value"]');
  await expect(titleInput).toHaveText("Mira MDE Demo");
  await expect(titleInput).toHaveAttribute("contenteditable", "true");
  await expect(titleInput).toHaveClass(/metadata-input-longtext/);
  const publishedProperty = page.locator(
    '.metadata-property[data-property="published"]',
  );
  const publishedInput = publishedProperty.locator(
    'input[type="date"][aria-label="published value"]',
  );
  await expect(
    publishedProperty.locator(".metadata-input-leading-icon"),
  ).toHaveCount(0);
  await expect(publishedInput).toHaveValue("2026-06-28");
  await expect
    .poll(() =>
      publishedInput.evaluate((element) => {
        const style = getComputedStyle(element);
        return Number.parseFloat(style.paddingInlineStart);
      }),
    )
    .toBeGreaterThanOrEqual(24);
  const priorityInput = page
    .locator('.metadata-property[data-property="priority"]')
    .locator('input[type="number"][aria-label="priority value"]');
  await expect(priorityInput).toHaveValue("3");
  await expect(priorityInput).toHaveAttribute("inputmode", "decimal");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const rows = ["title", "status", "published", "featured", "priority"]
          .map((name) =>
            document.querySelector<HTMLElement>(
              `.metadata-property[data-property="${name}"] .metadata-property-value`,
            ),
          )
          .filter((element): element is HTMLElement => Boolean(element));
        const lefts = rows.map(
          (element) => element.getBoundingClientRect().left,
        );
        return Math.max(...lefts) - Math.min(...lefts);
      }),
    )
    .toBeLessThan(2);
  await expect
    .poll(() =>
      page
        .locator(".metadata-property-value")
        .first()
        .evaluate((element) =>
          getComputedStyle(element)
            .getPropertyValue("--metadata-value-content-offset")
            .trim(),
        ),
    )
    .toBe("0");
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

  const horizontalRuleWidget = page
    .locator(".mira-rich-widget--horizontalrule")
    .first();
  await expect(horizontalRuleWidget).toBeVisible();
  await expect(horizontalRuleWidget.locator("hr")).toBeVisible();
  await horizontalRuleWidget.click();
  await expect(editorContent(page)).toContainText("---");

  const fencedWidget = page
    .locator(".mira-rich-widget--fencedcode")
    .filter({ has: page.locator(".mermaid") })
    .first();
  await scrollEditorUntilVisible(page, fencedWidget, { max: 10_000 });
  await expect(fencedWidget).toBeVisible();
  await fencedWidget.hover();
  await fencedWidget.locator(".mira-rich-widget__source-toggle").click();

  await expect(editorContent(page)).toContainText("~~~mermaid");
  await expect(editorContent(page)).toContainText("flowchart LR");
});

test("split view button toggles back to the previous view", async ({
  page,
}) => {
  await gotoDemo(page);
  const splitButton = page
    .locator(".demo-toolbar")
    .getByRole("button", { name: "Split", exact: true });

  await setMode(page, "Source");
  await splitButton.click();
  await expect(page.locator(".mira-mde")).toHaveAttribute("data-mode", "split");
  await expect(splitButton).toHaveAttribute("aria-pressed", "true");
  await splitButton.click();
  await expect(page.locator(".mira-mde")).toHaveAttribute(
    "data-mode",
    "source",
  );
  await expect(splitButton).not.toHaveAttribute("aria-pressed", "true");

  await setMode(page, "Preview");
  await splitButton.click();
  await expect(page.locator(".mira-mde")).toHaveAttribute("data-mode", "split");
  await expect(splitButton).toHaveAttribute("aria-pressed", "true");
  await splitButton.click();
  await expect(page.locator(".mira-mde")).toHaveAttribute(
    "data-mode",
    "preview",
  );
  await expect(splitButton).not.toHaveAttribute("aria-pressed", "true");
});

test("split view synchronizes vertical scroll between editor and preview", async ({
  page,
}) => {
  await gotoDemo(page);
  await setMode(page, "Split");

  const editorScroller = page
    .locator(".mira-mde__editor-host > .cm-editor > .cm-scroller")
    .first();
  const previewScroller = page
    .locator(".mira-mde__pane--preview .mira-markdown-preview")
    .first();
  await expect(previewScroller).toBeVisible();

  await editorScroller.evaluate((element) => {
    element.scrollTop = 1_600;
    element.dispatchEvent(new Event("scroll"));
  });
  await expect
    .poll(() => previewScroller.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);

  await previewScroller.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
    element.dispatchEvent(new Event("scroll"));
  });
  await expect
    .poll(() => editorScroller.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(1_600);
});

test("view options expose editor indentation settings", async ({ page }) => {
  await gotoDemo(page);

  await page
    .locator(".demo-toolbar")
    .getByRole("button", { name: "View options" })
    .click();

  await expect(
    page.getByRole("menuitem", { name: "Indentation guides", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("menuitem", {
      name: "Use tabs for indentation",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("menuitem", { name: "2 spaces", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("menuitem", { name: "4 spaces", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("menuitem", { name: "8 spaces", exact: true }),
  ).toBeVisible();
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

  const inlineCode = page
    .locator(".cm-inline-code")
    .filter({ hasText: "inline code" })
    .first();
  await expect(inlineCode).toBeVisible();
  const inlineCodeStyle = await inlineCode.evaluate((element) => {
    const probe = document.createElement("span");
    probe.style.backgroundColor = "var(--markdown-code-background)";
    element.append(probe);
    const expectedBackground = getComputedStyle(probe).backgroundColor;
    probe.remove();
    const style = getComputedStyle(element);
    return {
      actualBackground: style.backgroundColor,
      expectedBackground,
      paddingInlineStart: Number.parseFloat(style.paddingInlineStart),
    };
  });
  expect(inlineCodeStyle.actualBackground).toBe(
    inlineCodeStyle.expectedBackground,
  );
  expect(inlineCodeStyle.paddingInlineStart).toBeGreaterThan(0);
  await inlineCode.click();
  await expect(page.locator(".cm-content")).toContainText("`inline code`");
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
  await expect
    .poll(() =>
      previewTask.evaluate(
        (element) => getComputedStyle(element).textDecorationLine,
      ),
    )
    .toBe("none");

  await setMode(page, "Live");
  await scrollEditor(page, 0);
  await expect(page.locator(".cm-line.cm-header-1")).toBeVisible();
  await expectHiddenFormattingCount(page, "Mira MDE", "#", 1);
  await page.locator(".cm-line.cm-header-1").first().click();
  await expectHiddenFormattingCount(page, "Mira MDE", "#", 0);
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

  const liveTask = page.locator(".HyperMD-task-line").first();
  await scrollEditorUntilVisible(page, liveTask);
  await expect(liveTask).toBeVisible();
  const liveTaskCheckbox = liveTask.locator(
    '.mira-task-checkbox[data-task="x"]',
  );
  await expect(liveTaskCheckbox).toBeVisible();
  await expect(liveTaskCheckbox).toBeChecked();
  await expect
    .poll(() =>
      liveTaskCheckbox.evaluate((element) => {
        const marker = getComputedStyle(element, "::after");
        return {
          backgroundColor: marker.backgroundColor,
          display: marker.display,
          maskImage:
            marker.getPropertyValue("-webkit-mask-image") ||
            marker.getPropertyValue("mask-image"),
        };
      }),
    )
    .toEqual({
      backgroundColor: expect.not.stringMatching(/rgba\(0, 0, 0, 0\)/),
      display: "block",
      maskImage: expect.stringContaining("svg"),
    });
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
  const liveListCallout = page.locator(".cm-line.lc-list-callout").first();
  await scrollEditorUntilVisible(page, liveListCallout);
  await expect
    .poll(() =>
      liveListCallout.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).paddingBottom),
      ),
    )
    .toBeGreaterThan(0);
  await liveTask
    .getByText("Completed task without live-edit strikethrough")
    .click();
  await page.keyboard.press("Home");
  await expect(liveTask).toContainText("- [x]");
  await expectHiddenFormattingCount(
    page,
    "Completed task without live-edit strikethrough",
    "[",
    0,
  );
  const customTask = page.locator('.HyperMD-task-line[data-task="/"]').first();
  await scrollEditorUntilVisible(page, customTask, { max: 2_000, step: 100 });
  await expect(customTask).toBeVisible();
  const customTaskCheckbox = customTask.locator(
    '.mira-task-checkbox[data-task="/"]',
  );
  await expect(customTaskCheckbox).toBeVisible();
  await expect(customTask).not.toContainText("- [/]");
  await expect
    .poll(() =>
      customTaskCheckbox.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const marker = getComputedStyle(element, "::after");
        return {
          afterDisplay: marker.display,
          afterWidth: marker.width,
          height: rect.height,
          width: rect.width,
        };
      }),
    )
    .toEqual({
      afterDisplay: "block",
      afterWidth: expect.any(String),
      height: expect.any(Number),
      width: expect.any(Number),
    });
  await customTask.getByText("Custom task marker").click();
  await page.keyboard.press("Home");
  await expect(customTask).toContainText("- [/]");
  await expectHiddenFormattingCount(page, "Custom task marker", "[", 0);
});

test("live inline markdown is styled and reveals source by token", async ({
  page,
}) => {
  await gotoDemo(page);
  await setMode(page, "Live");
  await scrollEditor(page, 0);

  const lineSnippet = "Inline";
  await expectHiddenFormattingCount(page, lineSnippet, "**", 2);
  await expectHiddenFormattingCount(page, lineSnippet, "_", 2);
  await expectHiddenFormattingCount(page, lineSnippet, "~~", 2);
  await expectHiddenFormattingCount(page, lineSnippet, "`", 2);
  const hiddenPathLinkMiddle = await hiddenFormattingCount(
    page,
    lineSnippet,
    "[",
  );
  expect(hiddenPathLinkMiddle).toBeGreaterThan(1);
  const renderedWikilink = page
    .locator(".mira-inline-markdown-widget")
    .filter({ hasText: "wikilinks" })
    .first();
  await expect(renderedWikilink).toBeVisible();
  await expect(renderedWikilink).not.toContainText("[[");
  await expect(renderedWikilink).not.toContainText("Project Plan|");
  await expect(renderedWikilink.locator(".mira-link-preview")).toBeVisible();
  const inlineImageEmbed = page
    .locator(".mira-inline-markdown-widget .mira-embed")
    .filter({ hasText: "Architecture diagram embed" })
    .first();
  await expect(inlineImageEmbed).toBeVisible();
  await expect(inlineImageEmbed.locator("img")).toHaveAttribute(
    "src",
    "/mira-markdown-demo.svg",
  );
  const liveEmbedStyle = await inlineImageEmbed.evaluate((element) => {
    const style = getComputedStyle(element);
    const caption = element.querySelector("figcaption");
    const image = element.querySelector("img");
    return {
      borderInlineStartWidth: Number.parseFloat(style.borderInlineStartWidth),
      captionDisplay: caption ? getComputedStyle(caption).display : "",
      display: style.display,
      imageMaxHeight: image ? getComputedStyle(image).maxHeight : "",
      marginBlockStart: Number.parseFloat(style.marginBlockStart),
      paddingInlineStart: Number.parseFloat(style.paddingInlineStart),
    };
  });
  expect(liveEmbedStyle.display).toBe("block");
  expect(liveEmbedStyle.borderInlineStartWidth).toBeGreaterThan(0);
  expect(liveEmbedStyle.captionDisplay).not.toBe("none");
  expect(liveEmbedStyle.imageMaxHeight).toBe("none");
  expect(liveEmbedStyle.marginBlockStart).toBeGreaterThan(0);
  expect(liveEmbedStyle.paddingInlineStart).toBeGreaterThan(0);
  await renderedWikilink.locator("[data-link-preview-trigger]").hover();
  await expect(
    renderedWikilink.locator(
      ".mira-link-preview__card .mira-embedded-markdown-preview h1",
    ),
  ).toContainText("Project Plan");
  await expect
    .poll(() =>
      renderedWikilink.evaluate((element) => {
        const paragraph = element.querySelector<HTMLElement>("p");
        return {
          display: getComputedStyle(element).display,
          linkDisplay: getComputedStyle(
            element.querySelector<HTMLElement>(".mira-link-preview")!,
          ).display,
          paragraphDisplay: paragraph
            ? getComputedStyle(paragraph).display
            : "",
        };
      }),
    )
    .toEqual({
      display: "inline",
      linkDisplay: "inline",
      paragraphDisplay: "inline",
    });
  const externalLiveLink = page
    .locator(".cm-external-link .cm-link")
    .filter({ hasText: "external links" })
    .first();
  await expect(externalLiveLink).toBeVisible();
  await expect
    .poll(() =>
      externalLiveLink.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          backgroundImage: style.backgroundImage,
          paddingInlineEnd: Number.parseFloat(style.paddingInlineEnd),
        };
      }),
    )
    .toEqual({
      backgroundImage: expect.stringContaining("svg"),
      paddingInlineEnd: expect.any(Number),
    });

  const inlineMath = page.locator(".mira-inline-math-widget").first();
  await expect(inlineMath.locator(".katex")).toBeVisible();
  await inlineMath.click();
  await expect(editorContent(page)).toContainText("$E = mc^2$");

  const strong = page.locator(".cm-strong").filter({ hasText: "bold" }).first();
  await expect(strong).toBeVisible();
  await expect
    .poll(() =>
      strong.evaluate((element) => getComputedStyle(element).fontWeight),
    )
    .toMatch(/^(800|900|bold)$/);
  await strong.click();
  await expectHiddenFormattingCount(page, lineSnippet, "**", 0);

  const emphasis = page
    .locator(".cm-emphasis")
    .filter({ hasText: "italic" })
    .first();
  await expect(emphasis).toBeVisible();
  await expect
    .poll(() =>
      emphasis.evaluate((element) => getComputedStyle(element).fontStyle),
    )
    .toBe("italic");
  await emphasis.click();
  await expectHiddenFormattingCount(page, lineSnippet, "_", 0);

  const strikethrough = page
    .locator(".cm-strikethrough")
    .filter({ hasText: "strikethrough" })
    .first();
  await expect(strikethrough).toBeVisible();
  await expect
    .poll(() =>
      strikethrough.evaluate(
        (element) => getComputedStyle(element).textDecorationLine,
      ),
    )
    .toContain("line-through");
  await strikethrough.click();
  await expectHiddenFormattingCount(page, lineSnippet, "~~", 0);

  const inlineCode = page
    .locator(".cm-inline-code")
    .filter({ hasText: "inline code" })
    .first();
  await expect(inlineCode).toBeVisible();
  await expect
    .poll(() =>
      inlineCode.evaluate((element) => {
        const probe = document.createElement("span");
        probe.style.color = "var(--markdown-code-normal, var(--code-normal))";
        probe.style.backgroundColor = "var(--markdown-code-background)";
        element.append(probe);
        const expectedColor = getComputedStyle(probe).color;
        const expectedBackground = getComputedStyle(probe).backgroundColor;
        probe.remove();
        const style = getComputedStyle(element);
        return {
          backgroundColor: style.backgroundColor,
          color: style.color,
          expectedBackground,
          expectedColor,
          fontFamily: style.fontFamily.toLowerCase(),
          paddingInlineStart: Number.parseFloat(style.paddingInlineStart),
        };
      }),
    )
    .toEqual({
      backgroundColor: expect.any(String),
      color: expect.any(String),
      expectedBackground: expect.any(String),
      expectedColor: expect.any(String),
      fontFamily: expect.stringContaining("source code pro"),
      paddingInlineStart: expect.any(Number),
    });
  const inlineCodeStyle = await inlineCode.evaluate((element) => {
    const probe = document.createElement("span");
    probe.style.color = "var(--markdown-code-normal, var(--code-normal))";
    probe.style.backgroundColor = "var(--markdown-code-background)";
    element.append(probe);
    const expectedColor = getComputedStyle(probe).color;
    const expectedBackground = getComputedStyle(probe).backgroundColor;
    probe.remove();
    const style = getComputedStyle(element);
    return {
      actualBackground: style.backgroundColor,
      actualColor: style.color,
      expectedBackground,
      expectedColor,
      paddingInlineStart: Number.parseFloat(style.paddingInlineStart),
    };
  });
  expect(inlineCodeStyle.actualColor).toBe(inlineCodeStyle.expectedColor);
  expect(inlineCodeStyle.actualBackground).toBe(
    inlineCodeStyle.expectedBackground,
  );
  expect(inlineCodeStyle.paddingInlineStart).toBeGreaterThan(0);
  await inlineCode.click();
  await expectHiddenFormattingCount(page, lineSnippet, "`", 0);

  const pathLink = page
    .locator(".cm-link-text")
    .filter({ hasText: "path links" })
    .first();
  await expect(pathLink).toBeVisible();
  await pathLink.click();
  await expectHiddenFormattingCountBelow(
    page,
    lineSnippet,
    "[",
    hiddenPathLinkMiddle,
  );
  await expect(page.locator(".cm-link-target").first()).toBeVisible();

  await renderedWikilink.click();
  await expect(editorContent(page)).toContainText("[[Project Plan|wikilinks]]");
});

test("preview mode showcases the supported Markdown feature set", async ({
  page,
}) => {
  await gotoDemo(page);
  await setMode(page, "Preview");

  const preview = page.locator(".mira-markdown-preview").first();
  await expect(preview.locator("del").first()).toContainText("strikethrough");
  await expect(
    preview.locator("code").filter({ hasText: "inline code" }),
  ).toBeVisible();
  await expect(preview.locator("hr").first()).toBeVisible();
  const codeBlock = preview
    .locator("pre")
    .filter({ hasText: "createMiraDefaultEditor" })
    .first();
  const copyButton = codeBlock.getByRole("button", { name: "Copy code" });
  await expect(copyButton).toHaveCount(1);
  await expect
    .poll(() =>
      copyButton.evaluate((element) => ({
        opacity: getComputedStyle(element.parentElement ?? element).opacity,
        text: element.textContent?.trim() ?? "",
      })),
    )
    .toEqual({ opacity: "0", text: "" });
  await codeBlock.hover();
  await expect
    .poll(() =>
      copyButton.evaluate(
        (element) => getComputedStyle(element.parentElement ?? element).opacity,
      ),
    )
    .toBe("1");
  await expect(
    preview.locator("[data-mira-internal-link]").first(),
  ).toBeVisible();
  const externalLink = preview.locator(
    'a.external-link[href="https://example.com"]',
  );
  await expect(externalLink).toHaveCount(2);
  await expect(
    externalLink.filter({ hasText: "external links" }),
  ).toHaveAttribute("target", "_blank");
  const pathLink = preview.getByRole("button", {
    name: "path links",
    exact: true,
  });
  await pathLink.hover();
  const pathPreview = pathLink.locator(
    'xpath=ancestor::span[contains(@class, "mira-link-preview")][1]',
  );
  await expect(pathPreview.locator(".mira-link-preview__card")).toBeVisible();
  await expect(
    pathPreview.locator(".mira-embedded-markdown-preview h1").first(),
  ).toContainText("Architecture");
  await expect(
    preview.locator(".mira-embed").filter({ hasText: "Embedded Note" }).first(),
  ).toContainText("same preview component");
  await expect(
    preview.locator(".mira-embed").filter({
      hasText: "Architecture diagram embed",
    }),
  ).toContainText("Architecture diagram embed");
  await expect(
    preview.locator(".tag").filter({ hasText: "#mira/editor" }),
  ).toBeVisible();
  await expect(preview.locator(".katex").first()).toBeVisible();
  await expect(
    preview.locator('img[alt="Mira Markdown demo asset"]'),
  ).toBeVisible();
  await expect(preview.locator("mark")).toContainText("Raw HTML is preserved");
  const kbd = preview.locator("kbd").filter({ hasText: "keyboard" }).first();
  await expect(kbd).toContainText("keyboard");
  await expect
    .poll(() =>
      kbd.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          borderBottomWidth: Number.parseFloat(style.borderBottomWidth),
          display: style.display,
          fontFamily: style.fontFamily.toLowerCase(),
        };
      }),
    )
    .toEqual({
      borderBottomWidth: 2,
      display: "inline-flex",
      fontFamily: expect.stringContaining("source code pro"),
    });
  await expect(
    preview.locator('directive[data-directive="mira"]'),
  ).toContainText("Directive syntax is parsed");
  await expect(preview).toContainText(
    "Footnotes come from the shared GFM Markdown pipeline.",
  );
  const taskMarkers = [
    ">",
    "<",
    "?",
    "/",
    "!",
    '"',
    "-",
    "*",
    "l",
    "i",
    "S",
    "I",
    "f",
    "k",
    "u",
    "d",
    "w",
    "p",
    "c",
    "b",
  ];
  const renderedTaskMarkers = await preview
    .locator("li.task-list-item")
    .evaluateAll((elements) =>
      elements
        .map((element) => element.getAttribute("data-task"))
        .filter(Boolean),
    );
  for (const marker of taskMarkers) {
    expect(renderedTaskMarkers).toContain(marker);
  }
  const markerStyles = await preview
    .locator(".task-list-item-checkbox")
    .evaluateAll((elements) =>
      Object.fromEntries(
        elements
          .map((element) => {
            const marker = element.getAttribute("data-task");
            if (!marker) {
              return null;
            }
            const style = getComputedStyle(element);
            const afterStyle = getComputedStyle(element, "::after");
            return [
              marker,
              {
                afterDisplay: afterStyle.display,
                backgroundImage: style.backgroundImage,
                maskImage: style.getPropertyValue("-webkit-mask-image"),
              },
            ];
          })
          .filter((entry): entry is [string, unknown] => Boolean(entry)),
      ),
    );
  expect(markerStyles["-"].maskImage).toContain("svg");
  expect(markerStyles["?"].backgroundImage).toContain("svg");
  expect(markerStyles["/"].afterDisplay).toBe("block");
  expect(markerStyles["S"].backgroundImage).toContain("svg");
  expect(markerStyles["I"].maskImage).toContain("svg");
  const calloutTypes = [
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
  ];
  const renderedCalloutTypes = await preview
    .locator(".callout")
    .evaluateAll((elements) =>
      elements
        .map((element) => element.getAttribute("data-callout"))
        .filter(Boolean),
    );
  for (const type of calloutTypes) {
    expect(renderedCalloutTypes).toContain(type);
  }
  const calloutTitles = await preview
    .locator(".callout-title-inner")
    .evaluateAll((elements) => elements.map((element) => element.textContent));
  for (const title of [
    "Abstract, Summary, Tldr",
    "Info, Todo",
    "Tip, Hint, Important",
    "Success, Check, Done",
    "Question, Help, FAQ",
    "Warning, Caution, Attention",
    "Failure, Fail, Missing",
    "Danger, Error",
    "Quote, Cite",
  ]) {
    expect(calloutTitles).toContain(title);
  }

  const calloutHeading = preview.getByRole("heading", {
    name: "Callout variants",
  });
  await calloutHeading.scrollIntoViewIfNeeded();
  await calloutHeading.hover();
  const headingCollapse = calloutHeading.locator(".heading-collapse-indicator");
  await expect(headingCollapse).toBeVisible();
  await expect(headingCollapse).toHaveAttribute(
    "aria-label",
    "Collapse section",
  );
  await headingCollapse.click();
  await expect(calloutHeading).toHaveAttribute(
    "data-heading-collapsed",
    "true",
  );
  await expect(headingCollapse).toHaveAttribute("aria-expanded", "false");
  await expect
    .poll(() =>
      preview.locator('[data-heading-section-collapsed="true"]').count(),
    )
    .toBeGreaterThan(0);
});

test("live preview renders markdown file embeds", async ({ page }) => {
  await gotoDemo(page);
  await setMode(page, "Live");

  const embedWidget = page
    .locator(".mira-rich-widget--embedlink .mira-embed")
    .filter({ hasText: "Markdown embed preview" })
    .first();
  await scrollEditorUntilVisible(page, embedWidget, { max: 8_000 });
  await expect(embedWidget).toBeVisible();
  await expect(
    embedWidget
      .locator(".mira-embed__content > .mira-embedded-markdown-preview h1")
      .first(),
  ).toContainText("Embedded Note");
  await expect(embedWidget).toContainText("Nested markdown stays formatted");
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
  const liveTable = page
    .locator(".mira-rich-widget--table .cm-table-widget")
    .first();
  await scrollEditorUntilVisible(page, liveTable);
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
    const inlineEditorWasFocused =
      inlineEditor?.classList.contains("cm-focused") ?? false;
    inlineEditor?.classList.add("cm-focused");
    const rect = (node?: Element | null) => {
      const box = node?.getBoundingClientRect();
      return { height: box?.height ?? 0, width: box?.width ?? 0 };
    };

    const metrics = {
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
      inlineEditorOutlineStyle: inlineEditor
        ? getComputedStyle(inlineEditor).outlineStyle
        : "",
      inlineEditorOutlineWidth: inlineEditor
        ? getComputedStyle(inlineEditor).outlineWidth
        : "",
      rowHandle: rect(rowHandle),
      rowHandleBorderLeft: rowHandle
        ? getComputedStyle(rowHandle).borderLeftWidth
        : "",
      rowHandleIcon: rect(rowHandleIcon),
    };
    if (!inlineEditorWasFocused) {
      inlineEditor?.classList.remove("cm-focused");
    }
    return metrics;
  });
  expect(tableMetrics.dataCell.height).toBeGreaterThan(37);
  expect(tableMetrics.dataCell.height).toBeLessThan(39);
  expect(tableMetrics.inlineEditor.height).toBeGreaterThan(21);
  expect(tableMetrics.inlineEditor.height).toBeLessThan(22);
  expect(tableMetrics.inlineEditorOutlineStyle).toBe("none");
  expect(tableMetrics.inlineEditorOutlineWidth).toBe("0px");
  expect(tableMetrics.cellButtonBackground).toBe("rgba(0, 0, 0, 0)");
  expect(tableMetrics.bodyRowBorderBottom).toBe("0px");
  expect(tableMetrics.edgeButtonBorderLeft).toBe("0px");
  expect(tableMetrics.edgeButton.width).toBeCloseTo(20, 1);
  expect(tableMetrics.edgeIcon.width).toBeCloseTo(16, 1);
  expect(tableMetrics.rowHandleBorderLeft).toBe("0px");
  expect(tableMetrics.rowHandle.width).toBeCloseTo(16, 1);
  expect(tableMetrics.rowHandleIcon.width).toBeCloseTo(16, 1);
  const rightAlignedPipeCell = liveTable
    .locator("tbody td:not(.markdown-table-chrome)")
    .filter({ hasText: "ready" })
    .first();
  await rightAlignedPipeCell.click();
  await expect(
    rightAlignedPipeCell.locator(".cm-editor.mod-inline"),
  ).toBeVisible();
  await expect
    .poll(() =>
      rightAlignedPipeCell
        .locator(".cm-content")
        .first()
        .evaluate((element) => getComputedStyle(element).textAlign),
    )
    .toBe("right");
  await liveTable.hover();
  await expect(
    page
      .locator(".mira-rich-widget--table .markdown-widget-select-control")
      .first(),
  ).toBeVisible();
  const handleAlignment = await liveTable.evaluate((element) => {
    const rowGutter = element.querySelector<HTMLElement>(
      '[data-markdown-table-chrome="row-gutter"]',
    );
    const rowHandle = element.querySelector<HTMLElement>(
      '[data-markdown-table-drag-handle="row"]',
    );
    const colHeader = element.querySelector<HTMLElement>(
      '[data-markdown-table-chrome="col-header"]',
    );
    const colHandle = element.querySelector<HTMLElement>(
      '[data-markdown-table-drag-handle="col"]',
    );
    const center = (rect: DOMRect) => ({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    const rowGutterRect = rowGutter!.getBoundingClientRect();
    const rowHandleCenter = center(rowHandle!.getBoundingClientRect());
    const colHeaderRect = colHeader!.getBoundingClientRect();
    const colHandleCenter = center(colHandle!.getBoundingClientRect());

    return {
      colBorderDelta: Math.abs(colHandleCenter.y - colHeaderRect.bottom),
      colCenterDelta: Math.abs(
        colHandleCenter.x - (colHeaderRect.left + colHeaderRect.width / 2),
      ),
      rowBorderDelta: Math.abs(rowHandleCenter.x - rowGutterRect.right),
      rowCenterDelta: Math.abs(
        rowHandleCenter.y - (rowGutterRect.top + rowGutterRect.height / 2),
      ),
    };
  });
  expect(handleAlignment.rowBorderDelta).toBeLessThan(2);
  expect(handleAlignment.rowCenterDelta).toBeLessThan(2);
  expect(handleAlignment.colBorderDelta).toBeLessThan(2);
  expect(handleAlignment.colCenterDelta).toBeLessThan(2);
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
  await page.keyboard.press("Escape");
  const liveTableWidget = page.locator(".mira-rich-widget--table").first();
  const tableShapeBeforeActions = await tableWidgetShape(liveTableWidget);
  await liveTableWidget.locator("tfoot tr").hover();
  await liveTableWidget
    .locator('[data-markdown-table-chrome="add-row"] button')
    .click();
  await expectTableWidgetShape(liveTableWidget, {
    cols: tableShapeBeforeActions.cols,
    rows: tableShapeBeforeActions.rows + 1,
  });
  await liveTableWidget.locator("tbody tr").first().hover();
  await liveTableWidget
    .locator('[data-markdown-table-chrome="add-col"] button')
    .click();
  await expectTableWidgetShape(liveTableWidget, {
    cols: tableShapeBeforeActions.cols + 1,
    rows: tableShapeBeforeActions.rows + 1,
  });
  const liveMultiMarkdownTable = page
    .locator(".mira-rich-widget--table")
    .filter({ hasText: "Combined cell" })
    .first();
  await scrollEditorUntilVisible(page, liveMultiMarkdownTable);
  await expect(liveMultiMarkdownTable.locator("td[colspan='2']")).toContainText(
    "Combined cell",
  );
  await expect(liveMultiMarkdownTable.locator("td[rowspan='2']")).toContainText(
    "Persistent row",
  );
  const multiMarkdownSpanCell = liveMultiMarkdownTable
    .locator("td[colspan='2']")
    .filter({ hasText: "Combined cell" })
    .first();
  await multiMarkdownSpanCell.click();
  await expect(
    multiMarkdownSpanCell.locator(".cm-editor.mod-inline"),
  ).toBeVisible();
  await expect(multiMarkdownSpanCell.locator(".cm-content")).toContainText(
    "Combined cell",
  );
  const liveGridTable = page
    .locator(".mira-rich-widget--gridtable .cm-table-widget")
    .first();
  await scrollEditorUntilVisible(page, liveGridTable);
  await expect(liveGridTable).toBeVisible();
  await liveGridTable.locator("tbody tr").first().hover();
  await expect(
    page
      .locator(
        '.mira-rich-widget--gridtable [data-markdown-table-drag-handle="row"]',
      )
      .first(),
  ).toBeVisible();
  const gridRowHandleAlignment = await liveGridTable.evaluate((element) => {
    const rowGutter = element.querySelector<HTMLElement>(
      '[data-markdown-table-chrome="row-gutter"]',
    );
    const rowHandle = element.querySelector<HTMLElement>(
      '[data-markdown-table-drag-handle="row"]',
    );
    const center = (rect: DOMRect) => ({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    const rowGutterRect = rowGutter!.getBoundingClientRect();
    const rowHandleCenter = center(rowHandle!.getBoundingClientRect());

    return {
      rowBorderDelta: Math.abs(rowHandleCenter.x - rowGutterRect.right),
      rowCenterDelta: Math.abs(
        rowHandleCenter.y - (rowGutterRect.top + rowGutterRect.height / 2),
      ),
    };
  });
  expect(gridRowHandleAlignment.rowBorderDelta).toBeLessThan(2);
  expect(gridRowHandleAlignment.rowCenterDelta).toBeLessThan(2);
  await liveGridTable.locator("thead th").nth(1).hover();
  await expect(
    page
      .locator(
        '.mira-rich-widget--gridtable [data-markdown-table-drag-handle="col"]',
      )
      .first(),
  ).toBeVisible();
  await expect(
    page
      .locator(
        '.mira-rich-widget--gridtable [data-markdown-table-chrome="row-gutter"] [data-slot="dropdown-menu-trigger"]',
      )
      .first(),
  ).toBeVisible();
  await expect(
    page
      .locator(
        '.mira-rich-widget--gridtable [data-markdown-table-chrome="col-header"] [data-slot="dropdown-menu-trigger"]',
      )
      .first(),
  ).toBeVisible();
  const liveGridTableWidget = page
    .locator(".mira-rich-widget--gridtable")
    .first();
  const gridShapeBeforeActions = await tableWidgetShape(liveGridTableWidget);
  await liveGridTableWidget.locator("tfoot tr").hover();
  await liveGridTableWidget
    .locator('[data-markdown-table-chrome="add-row"] button')
    .click();
  await expectTableWidgetShape(liveGridTableWidget, {
    cols: gridShapeBeforeActions.cols,
    rows: gridShapeBeforeActions.rows + 1,
  });
  await liveGridTableWidget.locator("tbody tr").first().hover();
  await liveGridTableWidget
    .locator('[data-markdown-table-chrome="add-col"] button')
    .click();
  await expectTableWidgetShape(liveGridTableWidget, {
    cols: gridShapeBeforeActions.cols + 1,
    rows: gridShapeBeforeActions.rows + 1,
  });
  const justifyGridTable = page
    .locator(".mira-rich-widget--gridtable .cm-table-widget")
    .filter({ hasText: "A b C" })
    .first();
  await scrollEditorUntilVisible(page, justifyGridTable, { max: 10_000 });
  await expect(justifyGridTable).toBeVisible();
  for (const [align, text] of [
    ["center", "ABC"],
    ["left", "ABC"],
    ["right", "ABC"],
  ] as const) {
    const alignedGridCell = page
      .locator(
        `.mira-rich-widget--gridtable .cm-table-widget td[data-align="${align}"]`,
      )
      .filter({ hasText: text })
      .first();
    await scrollEditorUntilVisible(page, alignedGridCell, { max: 10_000 });
    await expect(alignedGridCell).toBeVisible();
  }
  const rightAlignedGridCell = page
    .locator(
      '.mira-rich-widget--gridtable .cm-table-widget td[data-align="right"]',
    )
    .filter({ hasText: "ABC" })
    .first();
  await scrollEditorUntilVisible(page, rightAlignedGridCell, { max: 10_000 });
  await rightAlignedGridCell.click();
  await expect(
    rightAlignedGridCell.locator(".cm-editor.mod-inline"),
  ).toBeVisible();
  await expect
    .poll(() =>
      rightAlignedGridCell
        .locator(".cm-content")
        .first()
        .evaluate((element) => getComputedStyle(element).textAlign),
    )
    .toBe("right");
  const formattedGridTable = page
    .locator(".mira-rich-widget--gridtable")
    .filter({ hasText: "formatted" })
    .first();
  await scrollEditorUntilVisible(page, formattedGridTable, { max: 10_000 });
  const formattedGridCell = formattedGridTable
    .locator("td")
    .filter({ hasText: "formatted" })
    .first();
  await formattedGridCell.click();
  await expect(
    formattedGridCell.locator(".cm-editor.mod-inline"),
  ).toBeVisible();
  await expect(
    formattedGridCell.locator(".cm-emphasis").filter({ hasText: "formatted" }),
  ).toBeVisible();
  await expect(
    formattedGridCell.locator(".cm-strong").filter({ hasText: "paragraphs" }),
  ).toBeVisible();
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
  const liveSvg = page
    .locator(".mira-rich-widget--fencedcode .mermaid > .mermaid svg")
    .first();
  await scrollEditorUntilVisible(page, liveSvg, { max: 8_000 });
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
  await mermaidWidget
    .getByRole("button", { name: "Expand Mermaid diagram" })
    .click();
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
