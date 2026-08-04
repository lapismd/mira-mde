import { expect, test, type Locator, type Page } from "@playwright/test";

async function gotoStory(page: Page, id: string): Promise<void> {
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await expect(page.locator("#storybook-root")).toBeVisible();
  await expect(page.locator("[data-indentation-story]")).toBeVisible();
  await settleLayout(page);
  const measuredLines = page.locator(
    '.cm-editor:visible .cm-line[data-list-kind], .cm-editor:visible .cm-line[data-indent-prefix]:not([data-indent-prefix=""])',
  );
  if ((await measuredLines.count()) > 0) {
    await expect
      .poll(async () => {
        const readMeasurements = () =>
          measuredLines.evaluateAll((lines) =>
            lines.map((line) =>
              line instanceof HTMLElement
                ? [
                    line.style
                      .getPropertyValue("--hmd-indent-padding-measured")
                      .trim(),
                    line.style
                      .getPropertyValue("--hmd-indent-prefix-measured")
                      .trim(),
                  ]
                : ["", ""],
            ),
          );
        const before = await readMeasurements();
        await settleLayout(page);
        const after = await readMeasurements();
        return (
          after.every(([padding, prefix]) => Boolean(padding && prefix)) &&
          JSON.stringify(before) === JSON.stringify(after)
        );
      })
      .toBe(true);
  }
}

async function settleLayout(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  });
}

function lineContaining(page: Page, snippet: string): Locator {
  return page
    .locator(".cm-editor .cm-line")
    .filter({ hasText: snippet })
    .first();
}

type LineMetrics = {
  anchorFrom: string | null;
  contentLeft: number | null;
  depth: string | null;
  firstGlyphLeft: number | null;
  guideCount: number;
  guideDisplay: string;
  guideHeight: number;
  guideImage: string;
  hasIndentWidget: boolean;
  indentSegmentWidths: number[];
  lineLeft: number;
  lineHeight: number;
  listIndentWidth: number;
  markerRight: number | null;
  measuredPadding: string;
  measuredPrefix: string;
  paddingInlineStart: number;
  rowLefts: number[];
  textIndent: number;
  variant: string | null;
};

type CodeBlockChromeMetrics = {
  background: string;
  borderBottom: number;
  borderLeft: number;
  borderRight: number;
  borderTop: number;
  height: number;
  inlineBackground: string | null;
  inlineBorderWidth: number | null;
  inlinePadding: number | null;
  paddingBottom: number;
  paddingRight: number;
  paddingTop: number;
  radius: number;
};

async function lineMetrics(line: Locator): Promise<LineMetrics> {
  return line.evaluate((element) => {
    function firstTextRects(root: HTMLElement): DOMRect[] {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!(node instanceof Text)) continue;
        const text = node.textContent ?? "";
        const first = Array.from(text).findIndex((character) =>
          /\S/u.test(character),
        );
        if (first === -1) continue;
        const range = document.createRange();
        range.setStart(node, first);
        range.setEnd(node, node.length);
        const rects = Array.from(range.getClientRects()).filter(
          (rect) => rect.width > 0 || rect.height > 0,
        );
        if (rects.length > 0) {
          const rowRects: DOMRect[] = [];
          for (const rect of rects) {
            const existing = rowRects.find(
              (candidate) => Math.abs(candidate.top - rect.top) < 1,
            );
            if (!existing || rect.left < existing.left) {
              if (existing) rowRects.splice(rowRects.indexOf(existing), 1);
              rowRects.push(rect);
            }
          }
          return rowRects.sort((left, right) => left.top - right.top);
        }
      }
      return [];
    }

    const depth = element.dataset["listDepth"] ?? "1";
    const content =
      Array.from(
        element.querySelectorAll<HTMLElement>(
          `.cm-list-${depth}:not(.cm-formatting)`,
        ),
      ).at(-1) ?? element;
    const marker = element.querySelector<HTMLElement>(
      ".cm-formatting-list-ul, .cm-formatting-list-ol",
    );
    const widget = element.querySelector<HTMLElement>(
      ".cm-hmd-list-indent, .cm-plain-indent-widget",
    );
    const probe = document.createElement("span");
    probe.style.cssText =
      "height: 0; position: absolute; visibility: hidden; width: var(--list-indent);";
    element.append(probe);
    const listIndentWidth = probe.getBoundingClientRect().width;
    probe.remove();
    const contentRects = firstTextRects(content);
    const style = getComputedStyle(element);
    const guideStyle = getComputedStyle(element, "::before");

    return {
      anchorFrom: element.dataset["indentAnchorLineFrom"] ?? null,
      contentLeft: contentRects[0]?.left ?? null,
      depth: element.dataset["listDepth"] ?? null,
      firstGlyphLeft: contentRects[0]?.left ?? null,
      guideCount: element.querySelectorAll(".cm-indent-guide").length,
      guideDisplay: guideStyle.display,
      guideHeight: Number.parseFloat(guideStyle.height),
      guideImage: guideStyle.backgroundImage,
      hasIndentWidget: Boolean(widget),
      indentSegmentWidths: Array.from(
        element.querySelectorAll<HTMLElement>(".cm-indent"),
        (segment) => segment.getBoundingClientRect().width,
      ),
      lineLeft: element.getBoundingClientRect().left,
      lineHeight: element.getBoundingClientRect().height,
      listIndentWidth,
      markerRight: marker?.getBoundingClientRect().right ?? null,
      measuredPadding: element.style.getPropertyValue(
        "--hmd-indent-padding-measured",
      ),
      measuredPrefix: element.style.getPropertyValue(
        "--hmd-indent-prefix-measured",
      ),
      paddingInlineStart: Number.parseFloat(style.paddingInlineStart),
      rowLefts: contentRects.map((rect) => rect.left),
      textIndent: Number.parseFloat(style.textIndent),
      variant: element.dataset["indentVariant"] ?? null,
    };
  });
}

async function codeBlockChromeMetrics(
  block: Locator,
): Promise<CodeBlockChromeMetrics> {
  return block.evaluate((element) => {
    const style = getComputedStyle(element);
    const inline = element.querySelector<HTMLElement>(".cm-inline-code");
    const inlineStyle = inline ? getComputedStyle(inline) : null;
    return {
      background: style.backgroundColor,
      borderBottom: Number.parseFloat(style.borderBottomWidth),
      borderLeft: Number.parseFloat(style.borderLeftWidth),
      borderRight: Number.parseFloat(style.borderRightWidth),
      borderTop: Number.parseFloat(style.borderTopWidth),
      height: element.getBoundingClientRect().height,
      inlineBackground: inlineStyle?.backgroundColor ?? null,
      inlineBorderWidth: inlineStyle
        ? Number.parseFloat(inlineStyle.borderTopWidth)
        : null,
      inlinePadding: inlineStyle
        ? Number.parseFloat(inlineStyle.paddingTop)
        : null,
      paddingBottom: Number.parseFloat(style.paddingBottom),
      paddingRight: Number.parseFloat(style.paddingRight),
      paddingTop: Number.parseFloat(style.paddingTop),
      radius: Number.parseFloat(style.borderTopLeftRadius),
    };
  });
}

function expectStableRowLefts(metrics: LineMetrics): void {
  expect(metrics.rowLefts.length).toBeGreaterThan(1);
  expect(
    Math.max(...metrics.rowLefts) - Math.min(...metrics.rowLefts),
  ).toBeLessThan(1.5);
}

async function placeCaretAtLineOffset(
  page: Page,
  line: Locator,
  offset: number,
): Promise<void> {
  await line.click({ position: { x: 1, y: 5 } });
  await page.keyboard.press("Home");
  await page.keyboard.press("Home");
  for (let index = 0; index < offset; index += 1) {
    await page.keyboard.press("ArrowRight");
  }
  await settleLayout(page);
}

function expectSameContentColumn(
  actual: LineMetrics,
  expected: LineMetrics,
  context?: string,
): void {
  expect(actual.firstGlyphLeft).not.toBeNull();
  expect(expected.firstGlyphLeft).not.toBeNull();
  const delta = Math.abs(actual.firstGlyphLeft! - expected.firstGlyphLeft!);
  if (delta >= 1.5) {
    throw new Error(`${context ?? "content column"}: delta=${delta}`);
  }
}

async function expectContentColumnToSettle(
  line: Locator,
  expected: LineMetrics,
  context: string,
): Promise<void> {
  await expect
    .poll(
      async () => {
        const actual = await lineMetrics(line);
        if (
          actual.firstGlyphLeft === null ||
          expected.firstGlyphLeft === null
        ) {
          return Number.POSITIVE_INFINITY;
        }
        return Math.abs(actual.firstGlyphLeft - expected.firstGlyphLeft);
      },
      { message: context },
    )
    .toBeLessThan(1.5);
  await settleLayout(line.page());
  const settled = await lineMetrics(line);
  expectSameContentColumn(
    settled,
    expected,
    `${context}: ${JSON.stringify({
      paddingInlineStart: settled.paddingInlineStart,
      textIndent: settled.textIndent,
      firstGlyphLeft: settled.firstGlyphLeft,
      hasIndentWidget: settled.hasIndentWidget,
      indentSegmentWidths: settled.indentSegmentWidths,
      measuredPadding: settled.measuredPadding,
      measuredPrefix: settled.measuredPrefix,
    })}`,
  );
}

test("keeps wrapped ordered and unordered item rows aligned in both editor modes", async ({
  page,
}) => {
  for (const id of [
    "markdown-indentation--wrapped-list-items-source",
    "markdown-indentation--wrapped-list-items-live-preview",
  ]) {
    await gotoStory(page, id);

    for (const snippet of [
      "Navigate to the workspace",
      "Keep this unordered item",
    ]) {
      const line = lineContaining(page, snippet);
      await expect(line).toBeVisible();
      const metrics = await lineMetrics(line);
      expectStableRowLefts(metrics);
      expect(metrics.contentLeft).not.toBeNull();
      expect(metrics.markerRight).not.toBeNull();
      expect(metrics.contentLeft!).toBeGreaterThanOrEqual(
        metrics.markerRight! - 1,
      );
    }
  }
});

test("renders inactive dash and asterisk markers as live-preview bullets", async ({
  page,
}) => {
  await gotoStory(
    page,
    "markdown-indentation--wrapped-list-items-live-preview",
  );

  for (const snippet of [
    "Keep this unordered item",
    "Keep this asterisk-authored item",
  ]) {
    const line = lineContaining(page, snippet);
    const marker = line.locator(".cm-formatting-list-ul:has(> span.cm-meta)");
    await expect(marker).toHaveClass(/cm-formatting-list-bullet/u);
    const markerMetrics = await marker.evaluate((element) => {
      const source = element.querySelector<HTMLElement>("span.cm-meta");
      if (!source) return null;
      const sourceStyle = getComputedStyle(source);
      const bulletStyle = getComputedStyle(source, "::after");
      return {
        bulletBackground: bulletStyle.backgroundColor,
        bulletContent: bulletStyle.content,
        bulletHeight: Number.parseFloat(bulletStyle.height),
        bulletWidth: Number.parseFloat(bulletStyle.width),
        sourceColor: sourceStyle.color,
      };
    });
    expect(markerMetrics).not.toBeNull();
    expect(markerMetrics?.bulletContent).toBe('""');
    expect(markerMetrics?.bulletBackground).not.toBe("rgba(0, 0, 0, 0)");
    expect(markerMetrics?.bulletHeight).toBeGreaterThan(0);
    expect(markerMetrics?.bulletWidth).toBeGreaterThan(0);
    expect(markerMetrics?.sourceColor).toBe("rgba(0, 0, 0, 0)");
  }

  const dashLine = lineContaining(page, "Keep this unordered item");
  const dashMarker = dashLine.locator(
    ".cm-formatting-list-ul:has(> span.cm-meta)",
  );
  await placeCaretAtLineOffset(page, dashLine, 0);
  await expect(dashMarker).not.toHaveClass(/cm-formatting-list-bullet/u);
  await expect(dashMarker.locator("span.cm-meta")).toHaveText("-");

  await placeCaretAtLineOffset(page, dashLine, 2);
  await expect(dashMarker).toHaveClass(/cm-formatting-list-bullet/u);
});

test("covers authored continuation prefixes and the preformatted exception", async ({
  page,
}) => {
  for (const id of [
    "markdown-indentation--continuation-paragraphs-source",
    "markdown-indentation--continuation-paragraphs-live-preview",
  ]) {
    await gotoStory(page, id);

    for (const snippet of [
      "This single-space continuation",
      "This two-space continuation",
      "Four-space continuation text",
      "This blank-separated continuation",
      "This tab-authored continuation",
    ]) {
      const metrics = await lineMetrics(lineContaining(page, snippet));
      expect(metrics.variant).toBe("plain");
      expect(metrics.paddingInlineStart).toBeGreaterThan(0);
      expect(metrics.textIndent).toBeLessThan(0);
    }

    const bullet = await lineMetrics(lineContaining(page, "Bullet item"));
    const continuation = await lineMetrics(
      lineContaining(page, "This two-space continuation"),
    );
    expect(continuation.anchorFrom).not.toBeNull();
    expect(continuation.firstGlyphLeft).not.toBeNull();
    expect(bullet.firstGlyphLeft).not.toBeNull();

    const fourSpace = await lineMetrics(
      lineContaining(page, "Four-space continuation text"),
    );
    expect(fourSpace.guideCount).toBeGreaterThan(0);
  }

  await gotoStory(page, "markdown-indentation--continuation-paragraphs-source");
  const preformatted = await lineMetrics(
    lineContaining(page, "Eight-space preformatted content"),
  );
  expect(preformatted.anchorFrom).toBeNull();
});

test("preserves nested list depth and quoted checklist structure across surfaces", async ({
  page,
}) => {
  for (const id of [
    "markdown-indentation--nested-lists-and-quotes-source",
    "markdown-indentation--nested-lists-and-quotes-live-preview",
  ]) {
    await gotoStory(page, id);
    const parent = await lineMetrics(lineContaining(page, "Unordered parent"));
    const child = await lineMetrics(
      lineContaining(page, "Tab-authored unordered child"),
    );
    const grandchild = await lineMetrics(
      lineContaining(page, "Double-tab unordered grandchild"),
    );
    expect(parent.depth).toBe("1");
    expect(child.depth).toBe("2");
    expect(grandchild.depth).toBe("3");
    expect(child.paddingInlineStart).toBeGreaterThan(parent.paddingInlineStart);
    expect(grandchild.paddingInlineStart).toBeGreaterThan(
      child.paddingInlineStart,
    );
  }

  await gotoStory(page, "markdown-indentation--nested-lists-and-quotes-source");
  const quotedChecklist = lineContaining(page, "Quoted checklist child");
  await expect(quotedChecklist).toHaveAttribute(
    "data-indent-variant",
    "quote-list",
  );
  await expect(quotedChecklist).toHaveAttribute("data-list-kind", "ul");

  await gotoStory(
    page,
    "markdown-indentation--nested-lists-and-quotes-reading",
  );
  const reading = page.locator(".markdown-reading-view");
  await expect(reading.locator("ol ol ol")).toHaveCount(1);
  await expect(reading.locator("ul ul ul")).toHaveCount(1);
  await expect(reading.locator("blockquote blockquote")).toHaveCount(1);
  await expect(reading.locator('input[type="checkbox"]').first()).toBeVisible();
});

test("matches live-preview blockquote child spacing to reading mode", async ({
  page,
}) => {
  const readQuoteMetrics = async (blockquote: Locator) =>
    blockquote.evaluate((element) => {
      const paragraph = element.querySelector<HTMLElement>(":scope > p");
      const list = element.querySelector<HTMLElement>(":scope > ul");
      const listItem = list?.querySelector<HTMLElement>(":scope > li");
      const nestedList = listItem?.querySelector<HTMLElement>(":scope > ul");
      const nestedQuote = element.querySelector<HTMLElement>(
        ":scope > blockquote",
      );
      if (!paragraph || !list || !listItem || !nestedList || !nestedQuote) {
        throw new Error("Expected complete nested blockquote fixture");
      }
      const quoteRect = element.getBoundingClientRect();
      const paragraphRect = paragraph.getBoundingClientRect();
      const listRect = list.getBoundingClientRect();
      const listItemRect = listItem.getBoundingClientRect();
      return {
        height: quoteRect.height,
        listTopInset: listItemRect.top - listRect.top,
        nestedListHeight: nestedList.getBoundingClientRect().height,
        paragraphToListGap: listRect.top - paragraphRect.bottom,
        topInset: paragraphRect.top - quoteRect.top,
        whiteSpace: getComputedStyle(element).whiteSpace,
      };
    });

  await gotoStory(
    page,
    "markdown-indentation--nested-lists-and-quotes-live-preview",
  );
  const liveQuote = page
    .locator(".mira-rich-widget--blockquote blockquote")
    .first();
  await expect(liveQuote).toBeVisible();
  await expect(liveQuote.locator(":scope > blockquote")).toHaveCount(1);
  const live = await readQuoteMetrics(liveQuote);

  await gotoStory(
    page,
    "markdown-indentation--nested-lists-and-quotes-reading",
  );
  const readingQuote = page
    .locator(".markdown-reading-view blockquote")
    .first();
  await expect(readingQuote).toBeVisible();
  const reading = await readQuoteMetrics(readingQuote);

  expect(live.whiteSpace).toBe("normal");
  expect(Math.abs(live.topInset - reading.topInset)).toBeLessThanOrEqual(1.5);
  expect(
    Math.abs(live.listTopInset - reading.listTopInset),
  ).toBeLessThanOrEqual(1.5);
  expect(
    Math.abs(live.paragraphToListGap - reading.paragraphToListGap),
  ).toBeLessThanOrEqual(1.5);
  expect(
    Math.abs(live.nestedListHeight - reading.nestedListHeight),
  ).toBeLessThanOrEqual(1.5);
  expect(Math.abs(live.height - reading.height)).toBeLessThanOrEqual(2);
});

test("renders the indented live-preview blockquote in its focused story", async ({
  page,
}) => {
  await gotoStory(page, "markdown-indentation--active-prefixes-live-preview");

  const blockquote = page
    .locator(".cm-editor.cm-live-preview blockquote")
    .filter({ hasText: "Blockquote content stays aligned" })
    .first();
  await expect(blockquote).toBeVisible();
  const metrics = await blockquote.evaluate((element) => {
    const widget = element.closest<HTMLElement>(
      ".cm-formatting-block.markdown-rendered, .mira-rich-widget",
    );
    return {
      hasWidget: Boolean(widget),
      text: element.textContent?.replace(/\s+/gu, " ").trim() ?? "",
    };
  });
  expect(metrics.hasWidget).toBe(true);
  expect(metrics.text).toContain("rendered block attached");
});

test("aligns inactive continuation paragraphs with their parent content", async ({
  page,
}) => {
  for (const id of [
    "markdown-indentation--continuation-paragraphs-source",
    "markdown-indentation--continuation-paragraphs-live-preview",
  ]) {
    await gotoStory(page, id);
    for (const group of [
      {
        parent: "Bullet item",
        children: [
          "This single-space continuation",
          "This two-space continuation",
        ],
      },
      {
        parent: "Multiple paragraphs in a list item",
        children: [
          "Four-space continuation text",
          "This blank-separated continuation",
        ],
      },
    ]) {
      const parent = await lineMetrics(lineContaining(page, group.parent));
      expect(parent.firstGlyphLeft).not.toBeNull();
      for (const snippet of group.children) {
        const continuation = await lineMetrics(lineContaining(page, snippet));
        expect(continuation.anchorFrom).not.toBeNull();
        expect(continuation.hasIndentWidget).toBe(true);
        expect(continuation.indentSegmentWidths.length).toBeGreaterThan(0);
        for (const width of continuation.indentSegmentWidths) {
          expect(width).toBeGreaterThan(0);
        }
        expect(continuation.firstGlyphLeft).not.toBeNull();
        expect(
          Math.abs(continuation.firstGlyphLeft! - parent.firstGlyphLeft!),
        ).toBeLessThan(1.5);
        expectStableRowLefts(continuation);
      }
    }
  }
});

test("extends indentation guides across wrapped continuation line boxes", async ({
  page,
}) => {
  for (const id of [
    "markdown-indentation--continuation-paragraphs-source",
    "markdown-indentation--continuation-paragraphs-live-preview",
  ]) {
    await gotoStory(page, id);
    const metrics = await lineMetrics(
      lineContaining(page, "Four-space continuation text"),
    );
    expect(metrics.lineHeight).toBeGreaterThan(40);
    expect(metrics.guideCount).toBe(1);
    expect(metrics.guideDisplay).not.toBe("none");
    expect(metrics.guideImage).not.toBe("none");
    expect(Math.abs(metrics.guideHeight - metrics.lineHeight)).toBeLessThan(2);
  }
});

test("keeps continuation geometry stable while its prefix becomes editable", async ({
  page,
}) => {
  for (const id of [
    "markdown-indentation--continuation-paragraphs-source",
    "markdown-indentation--continuation-paragraphs-live-preview",
  ]) {
    await gotoStory(page, id);
    const parent = await lineMetrics(lineContaining(page, "Bullet item"));
    const continuationLine = lineContaining(
      page,
      "This two-space continuation",
    );
    const inactive = await lineMetrics(continuationLine);
    expect(inactive.hasIndentWidget).toBe(true);
    expectSameContentColumn(inactive, parent);

    for (const state of [
      { offset: 0, hasWidget: false },
      { offset: 1, hasWidget: false },
      { offset: 3, hasWidget: true },
    ]) {
      await placeCaretAtLineOffset(page, continuationLine, state.offset);
      const metrics = await lineMetrics(continuationLine);
      expect(metrics.hasIndentWidget).toBe(state.hasWidget);
      expectSameContentColumn(
        metrics,
        inactive,
        `${id} at offset ${state.offset}: ${JSON.stringify({ inactive, metrics })}`,
      );
      expectStableRowLefts(metrics);
    }

    await page.locator("[data-indentation-story]").focus();
    await expectContentColumnToSettle(
      continuationLine,
      inactive,
      `${id} after blur`,
    );
    await page.locator(".cm-content").focus();
    await expectContentColumnToSettle(
      continuationLine,
      inactive,
      `${id} after refocus`,
    );
  }
});

test("keeps preformatted list indentation stable across caret states", async ({
  page,
}) => {
  for (const id of [
    "markdown-indentation--continuation-paragraphs-source",
    "markdown-indentation--continuation-paragraphs-live-preview",
  ]) {
    await gotoStory(page, id);
    const line = lineContaining(page, "Eight-space preformatted content");
    await expect(line).toHaveClass(/cm-indented-codeblock/u);
    const inactive = await lineMetrics(line);
    expect(inactive.anchorFrom).toBeNull();
    expect(inactive.hasIndentWidget).toBe(true);
    expect(inactive.indentSegmentWidths).toHaveLength(2);
    for (const width of inactive.indentSegmentWidths) {
      expect(width).toBeGreaterThanOrEqual(inactive.listIndentWidth - 1);
    }
    expect(inactive.firstGlyphLeft! - inactive.lineLeft).toBeGreaterThan(
      inactive.listIndentWidth * 2 - 2,
    );
    expect(inactive.firstGlyphLeft! - inactive.lineLeft).toBeLessThan(
      inactive.listIndentWidth * 2 + 12,
    );

    for (const state of [
      { offset: 0, hasWidget: false },
      { offset: 4, hasWidget: false },
      { offset: 9, hasWidget: true },
    ]) {
      await placeCaretAtLineOffset(page, line, state.offset);
      await expect(line).toHaveClass(/cm-indented-codeblock/u);
      const metrics = await lineMetrics(line);
      expect(metrics.hasIndentWidget).toBe(state.hasWidget);
      expectSameContentColumn(
        metrics,
        inactive,
        `${id} at offset ${state.offset}`,
      );
      expectStableRowLefts(metrics);
    }
  }
});

test("renders indented preformatted content as one code block across editor modes", async ({
  page,
}) => {
  let liveChrome: CodeBlockChromeMetrics | undefined;

  for (const id of [
    "markdown-indentation--continuation-paragraphs-source",
    "markdown-indentation--continuation-paragraphs-live-preview",
  ]) {
    await gotoStory(page, id);
    const line = lineContaining(page, "Eight-space preformatted content");
    await expect(line).toHaveClass(/cm-indented-codeblock-start/u);
    await expect(line).toHaveClass(/cm-indented-codeblock-end/u);

    const chrome = await codeBlockChromeMetrics(line);
    expect(chrome.background).not.toBe("rgba(0, 0, 0, 0)");
    expect(chrome.borderTop).toBeGreaterThan(1.5);
    expect(chrome.borderRight).toBeGreaterThan(1.5);
    expect(chrome.borderBottom).toBeGreaterThan(1.5);
    expect(chrome.borderLeft).toBeGreaterThan(1.5);
    expect(chrome.radius).toBeGreaterThan(0);
    expect(chrome.paddingTop).toBeGreaterThanOrEqual(15);
    expect(chrome.paddingRight).toBeGreaterThanOrEqual(15);
    expect(chrome.paddingBottom).toBeGreaterThanOrEqual(15);
    expect(chrome.height).toBeGreaterThan(90);
    if (id.endsWith("live-preview")) {
      expect(chrome.inlineBackground).toBe("rgba(0, 0, 0, 0)");
      expect(chrome.inlineBorderWidth).toBe(0);
      expect(chrome.inlinePadding).toBe(0);
      liveChrome = chrome;
    } else {
      expect(chrome.inlineBackground).toBeNull();
    }
  }

  expect(liveChrome).toBeDefined();
  await page.getByRole("button", { name: "Reading view" }).click();
  await settleLayout(page);
  const readingBlock = page
    .locator(".markdown-rendered .mira-code-block")
    .filter({ hasText: "Eight-space preformatted content" });
  await expect(readingBlock).toBeVisible();
  const readingChrome = await codeBlockChromeMetrics(readingBlock);

  expect(readingChrome.background).toBe(liveChrome?.background);
  expect(readingChrome.borderTop).toBeCloseTo(liveChrome!.borderTop, 1);
  expect(readingChrome.borderRight).toBeCloseTo(liveChrome!.borderRight, 1);
  expect(readingChrome.borderBottom).toBeCloseTo(liveChrome!.borderBottom, 1);
  expect(readingChrome.borderLeft).toBeCloseTo(liveChrome!.borderLeft, 1);
  expect(readingChrome.radius).toBeCloseTo(liveChrome!.radius, 1);
  expect(readingChrome.paddingTop).toBeCloseTo(liveChrome!.paddingTop, 1);
  expect(readingChrome.paddingRight).toBeCloseTo(liveChrome!.paddingRight, 1);
  expect(readingChrome.paddingBottom).toBeCloseTo(liveChrome!.paddingBottom, 1);
});

test("attaches the indented blockquote widget without a whitespace source row", async ({
  page,
}) => {
  test.fail(
    true,
    "Mira currently retains one whitespace-only CodeMirror line before the rendered blockquote widget.",
  );
  await gotoStory(page, "markdown-indentation--active-prefixes-live-preview");
  const blockquote = page
    .locator(".cm-editor.cm-live-preview blockquote")
    .filter({ hasText: "Blockquote content stays aligned" })
    .first();
  await expect(blockquote).toBeVisible();
  const hasWhitespaceOnlyLineBefore = await blockquote.evaluate((element) => {
    const widget = element.closest<HTMLElement>(
      ".cm-formatting-block.markdown-rendered, .mira-rich-widget",
    );
    const previous = widget?.previousElementSibling;
    return Boolean(
      previous instanceof HTMLElement &&
      previous.classList.contains("cm-line") &&
      previous.textContent?.trim() === "",
    );
  });
  expect(hasWhitespaceOnlyLineBefore).toBe(false);
});

test("keeps active continuation and blockquote prefix geometry stable", async ({
  page,
}) => {
  await gotoStory(page, "markdown-indentation--active-prefixes-source");
  const continuationLine = lineContaining(
    page,
    "Wrapped continuation stays aligned",
  );
  const before = await lineMetrics(continuationLine);
  expect(before.variant).toBe("plain");
  expect(before.hasIndentWidget).toBe(false);

  const samples = await continuationLine.evaluate(async (element) => {
    const values: Array<{ left: number; padding: number; textIndent: number }> =
      [];
    for (let index = 0; index < 6; index += 1) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let text: Text | null = null;
      while (walker.nextNode()) {
        const candidate = walker.currentNode;
        if (!(candidate instanceof Text)) continue;
        const parent = candidate.parentElement;
        const skippedAncestor = parent?.closest(
          ".cm-hmd-list-indent, .cm-plain-indent-widget, .cm-formatting-list-ul, .cm-formatting-list-ol, .cm-blockquote-border, .cm-formatting-quote",
        );
        if (skippedAncestor && skippedAncestor !== element) {
          continue;
        }
        if (/\S/u.test(candidate.textContent ?? "")) {
          text = candidate;
          break;
        }
      }
      if (!text) continue;
      const offset = Array.from(text.textContent ?? "").findIndex((character) =>
        /\S/u.test(character),
      );
      const range = document.createRange();
      range.setStart(text, offset);
      range.setEnd(text, Math.min(offset + 1, text.length));
      const style = getComputedStyle(element);
      values.push({
        left: range.getBoundingClientRect().left,
        padding: Number.parseFloat(style.paddingInlineStart),
        textIndent: Number.parseFloat(style.textIndent),
      });
    }
    return values;
  });
  expect(samples).toHaveLength(6);
  expect(
    Math.max(...samples.map((sample) => sample.left)) -
      Math.min(...samples.map((sample) => sample.left)),
  ).toBeLessThan(1.5);

  const content = page.locator(".cm-content");
  const selectionBefore = await page.evaluate(() =>
    document.getSelection()?.toString(),
  );
  await page.locator("[data-indentation-story]").focus();
  await settleLayout(page);
  const afterBlur = await lineMetrics(continuationLine);
  await content.focus();
  await settleLayout(page);
  const afterRefocus = await lineMetrics(continuationLine);
  expect(afterBlur.paddingInlineStart).toBeCloseTo(
    before.paddingInlineStart,
    1,
  );
  expect(afterRefocus.paddingInlineStart).toBeCloseTo(
    before.paddingInlineStart,
    1,
  );
  expect(afterBlur.textIndent).toBeCloseTo(before.textIndent, 1);
  expect(afterRefocus.textIndent).toBeCloseTo(before.textIndent, 1);
  expect(await page.evaluate(() => document.getSelection()?.toString())).toBe(
    selectionBefore,
  );

  await gotoStory(page, "markdown-indentation--active-prefixes-live-preview");
  await page.getByRole("button", { name: "Edit source" }).click();
  await settleLayout(page);
  const quoteLine = lineContaining(page, "Blockquote content stays aligned");
  const quoteMetrics = await lineMetrics(quoteLine);
  expect(quoteMetrics.variant).toBe("quote");
  expect(quoteMetrics.hasIndentWidget).toBe(false);
  await expect(quoteLine.locator(".cm-formatting-quote")).toHaveCount(1);
});

test("applies the story's interactive eight-column indentation setting", async ({
  page,
}) => {
  await gotoStory(page, "markdown-indentation--configurable-indent-width");
  const content = page.locator(".cm-content");
  await expect
    .poll(() =>
      content.evaluate((element) => getComputedStyle(element).tabSize),
    )
    .toBe("8");
  const grandchild = lineContaining(page, "Double-tab grandchild");
  await expect(grandchild).toHaveAttribute("data-list-depth", "3");
  await expect(grandchild.locator(".cm-indent-guide")).toHaveCount(2);
});
