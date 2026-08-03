import { expect, test, type Locator, type Page } from "@playwright/test";

async function gotoStory(page: Page, id: string): Promise<void> {
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await expect(page.locator("#storybook-root")).toBeVisible();
  await expect(page.locator("[data-indentation-story]")).toBeVisible();
  await settleLayout(page);
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
  hasIndentWidget: boolean;
  markerRight: number | null;
  paddingInlineStart: number;
  rowLefts: number[];
  textIndent: number;
  variant: string | null;
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
    const contentRects = firstTextRects(content);
    const style = getComputedStyle(element);

    return {
      anchorFrom: element.dataset["indentAnchorLineFrom"] ?? null,
      contentLeft: contentRects[0]?.left ?? null,
      depth: element.dataset["listDepth"] ?? null,
      firstGlyphLeft: contentRects[0]?.left ?? null,
      guideCount: element.querySelectorAll(".cm-indent-guide").length,
      hasIndentWidget: Boolean(
        element.querySelector(".cm-hmd-list-indent, .cm-plain-indent-widget"),
      ),
      markerRight: marker?.getBoundingClientRect().right ?? null,
      paddingInlineStart: Number.parseFloat(style.paddingInlineStart),
      rowLefts: contentRects.map((rect) => rect.left),
      textIndent: Number.parseFloat(style.textIndent),
      variant: element.dataset["indentVariant"] ?? null,
    };
  });
}

function expectStableRowLefts(metrics: LineMetrics): void {
  expect(metrics.rowLefts.length).toBeGreaterThan(1);
  expect(
    Math.max(...metrics.rowLefts) - Math.min(...metrics.rowLefts),
  ).toBeLessThan(1.5);
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

test("aligns a continuation paragraph with its parent bullet text", async ({
  page,
}) => {
  test.fail(
    true,
    "Mira currently leaves the continuation one marker slot left of the parent item text.",
  );
  await gotoStory(page, "markdown-indentation--continuation-paragraphs-source");
  const bullet = await lineMetrics(lineContaining(page, "Bullet item"));
  const continuation = await lineMetrics(
    lineContaining(page, "This two-space continuation"),
  );
  expect(continuation.firstGlyphLeft).not.toBeNull();
  expect(bullet.firstGlyphLeft).not.toBeNull();
  expect(
    Math.abs(continuation.firstGlyphLeft! - bullet.firstGlyphLeft!),
  ).toBeLessThan(1.5);
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
