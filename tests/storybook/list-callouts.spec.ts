import { expect, test, type Locator, type Page } from "@playwright/test";

async function gotoStory(page: Page, id: string) {
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await expect(page.locator("#storybook-root")).toBeVisible();
}

async function scrollEditorUntilVisible(page: Page, locator: Locator) {
  const scroller = page
    .locator(".mira__editor-host > .cm-editor > .cm-scroller")
    .first();
  const scrollHeight = await scroller.evaluate(
    (element) => element.scrollHeight,
  );
  for (let top = 0; top <= scrollHeight; top += 400) {
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

async function calloutGeometry(
  line: Locator,
  contentText = "Highlighted with the default catalog",
) {
  return line.evaluate((element, expectedContent) => {
    const bullet = element.querySelector<HTMLElement>(".cm-formatting-list");
    const trigger = element.querySelector<HTMLElement>(
      ".mira-list-callout-trigger",
    );
    const glyph = trigger?.querySelector<HTMLElement>(
      ".mira-list-callout-glyph",
    );
    const background = element.querySelector<HTMLElement>(".lc-list-bg");
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let content: Text | null = null;
    while (walker.nextNode()) {
      const text = walker.currentNode as Text;
      if (text.data.includes(expectedContent)) {
        content = text;
        break;
      }
    }
    if (!bullet || !trigger || !glyph || !content) {
      throw new Error("List-highlight geometry target is missing");
    }
    const bulletRect = bullet.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    const glyphRect = glyph.getBoundingClientRect();
    const backgroundRect = background?.getBoundingClientRect();
    const contentRange = document.createRange();
    contentRange.selectNodeContents(content);
    const contentRects = Array.from(contentRange.getClientRects()).filter(
      (rect) => rect.width > 0 && rect.height > 0,
    );
    const firstContentRect = contentRects[0];
    if (!firstContentRect) {
      throw new Error("List-highlight content row is missing");
    }
    const markerChrome = getComputedStyle(trigger, "::before");
    const markerChromeLeft =
      triggerRect.left + (Number.parseFloat(markerChrome.left) || 0);
    const computedLineHeight = Number.parseFloat(
      getComputedStyle(element).lineHeight,
    );
    return {
      bulletLeft: bulletRect.left,
      bulletRight: bulletRect.right,
      triggerLeft: triggerRect.left,
      markerChromeLeft,
      glyphLeft: glyphRect.left,
      glyphRight: glyphRect.right,
      glyphCenterY: glyphRect.top + glyphRect.height / 2,
      contentLeft: firstContentRect.left,
      contentGap: firstContentRect.left - glyphRect.right,
      firstContentCenterY: firstContentRect.top + firstContentRect.height / 2,
      contentRowCount: contentRects.length,
      computedLineHeight,
      lineHeight: element.getBoundingClientRect().height,
      backgroundHeight: backgroundRect?.height ?? 0,
    };
  }, contentText);
}

async function triggerChrome(trigger: Locator) {
  return trigger.evaluate((element) => {
    const style = getComputedStyle(element, "::before");
    return {
      backgroundColor: style.backgroundColor,
      boxShadow: style.boxShadow,
    };
  });
}

function expectStableGeometry(
  before: Awaited<ReturnType<typeof calloutGeometry>>,
  after: Awaited<ReturnType<typeof calloutGeometry>>,
) {
  expect(Math.abs(after.bulletLeft - before.bulletLeft)).toBeLessThan(0.5);
  expect(Math.abs(after.triggerLeft - before.triggerLeft)).toBeLessThan(0.5);
  expect(Math.abs(after.contentLeft - before.contentLeft)).toBeLessThan(0.5);
  expect(Math.abs(after.lineHeight - before.lineHeight)).toBeLessThan(0.5);
}

test("live preview selects and clears resolved list highlights without shifting the line", async ({
  page,
}) => {
  await gotoStory(page, "markdown-lists--custom-callout-catalog-live");

  const root = page.locator(".mira-story-surface--editor");
  const line = page
    .locator(".cm-line.lc-list-callout")
    .filter({ hasText: "Highlighted with the default catalog" });
  const trigger = line.getByRole("button", {
    name: "Change list highlight (&)",
  });
  await expect(trigger).toBeVisible();
  await page.mouse.move(1, 1);
  await expect(trigger).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(trigger).toHaveCSS("box-shadow", "none");
  const before = await calloutGeometry(line);
  const restChrome = await triggerChrome(trigger);
  expect(restChrome.backgroundColor).toBe("rgba(0, 0, 0, 0)");
  expect(restChrome.boxShadow).toBe("none");
  expect(before.triggerLeft).toBeGreaterThanOrEqual(before.bulletRight - 0.5);
  expect(before.markerChromeLeft - before.bulletRight).toBeGreaterThan(1);
  expect(before.contentGap).toBeGreaterThan(3);
  expect(before.contentGap).toBeLessThan(9);
  expect(
    Math.abs(before.glyphCenterY - before.firstContentCenterY),
  ).toBeLessThan(1);

  await trigger.hover();
  const hoverChrome = await triggerChrome(trigger);
  expect(hoverChrome.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(hoverChrome.boxShadow).not.toBe("none");
  expectStableGeometry(before, await calloutGeometry(line));

  await trigger.click();
  const menu = page.locator(".mira-list-callout-menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("radio")).toHaveCount(8);
  await expect(
    menu.getByRole("radio", { name: "Use & list highlight" }),
  ).toHaveAttribute("aria-checked", "true");
  const customOption = menu.getByRole("radio", {
    name: "Use ^ list highlight",
  });
  await expect(customOption).toBeVisible();
  await expect(customOption).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await customOption.hover();
  await expect(customOption).not.toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  await expect(customOption).not.toHaveCSS("box-shadow", "none");
  await expect(
    menu.getByRole("radio", { name: "Use % list highlight" }),
  ).toHaveCount(0);
  expectStableGeometry(before, await calloutGeometry(line));

  await menu.getByRole("radio", { name: "Use ? list highlight" }).click();
  await expect(menu).toBeHidden();
  await expect(line).toHaveAttribute("data-callout", "?");
  await expect(root).toHaveAttribute(
    "data-markdown-value",
    /- \? Highlighted with the default catalog/u,
  );
  expectStableGeometry(before, await calloutGeometry(line));

  const questionTrigger = line.getByRole("button", {
    name: "Change list highlight (?)",
  });
  await questionTrigger.click();
  await page
    .locator(".mira-list-callout-menu")
    .getByRole("radio", { name: "Remove list highlight" })
    .click();
  await expect(root).toHaveAttribute(
    "data-markdown-value",
    /- Highlighted with the default catalog/u,
  );
  await expect(
    line.getByRole("button", { name: /Change list highlight/u }),
  ).toHaveCount(0);
});

test("list-highlight text and icons stay compact and centered when the item wraps", async ({
  page,
}) => {
  await gotoStory(page, "markdown-lists--custom-callout-catalog-live");

  const textLine = page
    .locator(".cm-line.lc-list-callout")
    .filter({ hasText: "Highlighted with the default catalog" });
  const iconLine = page
    .locator(".cm-line.lc-list-callout")
    .filter({ hasText: "Documentation uses the default book icon" });
  const wrappedLine = page.locator(".cm-line.lc-list-callout").filter({
    hasText: "A custom decision marker contributed by an extension",
  });

  const textGeometry = await calloutGeometry(textLine);
  const iconGeometry = await calloutGeometry(
    iconLine,
    "Documentation uses the default book icon",
  );
  const unwrappedGeometry = await calloutGeometry(
    wrappedLine,
    "A custom decision marker contributed by an extension",
  );

  expect(
    Math.abs(iconGeometry.contentLeft - textGeometry.contentLeft),
  ).toBeLessThan(0.75);
  expect(iconGeometry.contentGap).toBeGreaterThan(3);
  expect(iconGeometry.contentGap).toBeLessThan(9);
  expect(
    Math.abs(iconGeometry.glyphCenterY - iconGeometry.firstContentCenterY),
  ).toBeLessThan(1);

  await page.locator(".mira-story-surface--editor").evaluate((element) => {
    element.setAttribute(
      "style",
      `${element.getAttribute("style") ?? ""}; width: 28rem`,
    );
  });

  await expect
    .poll(async () => {
      const geometry = await calloutGeometry(
        wrappedLine,
        "A custom decision marker contributed by an extension",
      );
      return geometry.contentRowCount;
    })
    .toBeGreaterThan(1);

  const wrappedGeometry = await calloutGeometry(
    wrappedLine,
    "A custom decision marker contributed by an extension",
  );
  expect(wrappedGeometry.lineHeight).toBeGreaterThan(
    wrappedGeometry.computedLineHeight * 1.5,
  );
  expect(wrappedGeometry.backgroundHeight).toBeGreaterThanOrEqual(
    wrappedGeometry.lineHeight,
  );
  expect(
    Math.abs(
      wrappedGeometry.glyphCenterY - wrappedGeometry.firstContentCenterY,
    ),
  ).toBeLessThan(1);
  expect(
    Math.abs(wrappedGeometry.contentGap - unwrappedGeometry.contentGap),
  ).toBeLessThan(0.5);
});

test("list-highlight pickers stay off read-only and raw-source surfaces", async ({
  page,
}) => {
  await gotoStory(page, "markdown-lists--custom-callout-catalog");
  await expect(
    page.getByRole("button", { name: /Change list highlight/u }),
  ).toHaveCount(0);
  await expect(page.locator("[data-list-callout-marker]")).toHaveCount(3);

  await gotoStory(page, "demo-comprehensive--source");
  await expect(
    page.getByRole("button", { name: /Change list highlight/u }),
  ).toHaveCount(0);
  const rawCallout = page
    .locator(".cm-line")
    .filter({ hasText: "& Highlighted list callout item" });
  await scrollEditorUntilVisible(page, rawCallout);
  await expect(rawCallout).toContainText("& Highlighted list callout item");
});
