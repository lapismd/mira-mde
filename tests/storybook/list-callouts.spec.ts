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

async function calloutGeometry(line: Locator) {
  return line.evaluate((element) => {
    const bullet = element.querySelector<HTMLElement>(".cm-formatting-list");
    const trigger = element.querySelector<HTMLElement>(
      ".mira-list-callout-trigger",
    );
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let content: Text | null = null;
    while (walker.nextNode()) {
      const text = walker.currentNode as Text;
      if (text.data.includes("Highlighted with the default catalog")) {
        content = text;
        break;
      }
    }
    if (!bullet || !trigger || !content) {
      throw new Error("List-highlight geometry target is missing");
    }
    const bulletRect = bullet.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    const contentRange = document.createRange();
    contentRange.selectNodeContents(content);
    const contentRect = contentRange.getBoundingClientRect();
    return {
      bulletLeft: bulletRect.left,
      triggerLeft: triggerRect.left,
      contentLeft: contentRect.left,
      lineHeight: element.getBoundingClientRect().height,
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

  await trigger.hover();
  await expect(trigger).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(trigger).not.toHaveCSS("box-shadow", "none");
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
