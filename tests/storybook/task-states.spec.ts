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

async function taskGeometry(line: Locator) {
  return line.evaluate((element) => {
    const checkbox =
      element.querySelector<HTMLInputElement>(".cm-task-checkbox");
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let taskText: Text | null = null;
    while (walker.nextNode()) {
      const text = walker.currentNode as Text;
      if (text.data.includes("Needs decision")) {
        taskText = text;
        break;
      }
    }
    if (!checkbox || !taskText) {
      throw new Error("Task checkbox geometry target is missing");
    }
    const checkboxRect = checkbox.getBoundingClientRect();
    const textRange = document.createRange();
    textRange.selectNodeContents(taskText);
    const textRect = textRange.getBoundingClientRect();
    return {
      checkboxLeft: checkboxRect.left,
      checkboxTop: checkboxRect.top,
      textLeft: textRect.left,
      lineHeight: element.getBoundingClientRect().height,
    };
  });
}

function expectStableGeometry(
  before: Awaited<ReturnType<typeof taskGeometry>>,
  after: Awaited<ReturnType<typeof taskGeometry>>,
) {
  expect(Math.abs(after.checkboxLeft - before.checkboxLeft)).toBeLessThan(0.5);
  expect(Math.abs(after.checkboxTop - before.checkboxTop)).toBeLessThan(0.5);
  expect(Math.abs(after.textLeft - before.textLeft)).toBeLessThan(0.5);
  expect(Math.abs(after.lineHeight - before.lineHeight)).toBeLessThan(0.5);
}

test("live preview selects every shipped task type without changing line geometry", async ({
  page,
}) => {
  await gotoStory(page, "markdown-task-states--live-preview");

  const line = page
    .locator(".cm-task-line")
    .filter({ hasText: "Needs decision" });
  const checkbox = line.getByRole("checkbox", { name: "Toggle task" });
  const trigger = line.getByRole("button", { name: "Change task type" });
  await expect(checkbox).toBeVisible();
  await expect(trigger).toHaveCSS("position", "absolute");
  await expect(trigger).toHaveCSS("opacity", "0");
  const before = await taskGeometry(line);

  const checkboxBox = await checkbox.boundingBox();
  if (!checkboxBox) {
    throw new Error("Task checkbox bounding box is missing");
  }
  await page.mouse.move(
    checkboxBox.x - 8,
    checkboxBox.y + checkboxBox.height / 2,
  );
  await expect(trigger).toHaveCSS("opacity", "1");

  await page.mouse.move(1, 1);
  await expect(trigger).toHaveCSS("opacity", "0");
  await line.hover();
  await expect(trigger).toHaveCSS("opacity", "1");
  await trigger.hover();
  await expect(trigger).toHaveCSS("opacity", "1");
  const hoverSpacing = await line.evaluate((element) => {
    const checkbox = element.querySelector<HTMLElement>(".cm-task-checkbox");
    const button = element.querySelector<HTMLElement>(
      ".mira-task-state-trigger",
    );
    if (!checkbox || !button) {
      throw new Error("Task picker hover target is missing");
    }
    const checkboxRect = checkbox.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const visibleInset = Number.parseFloat(
      getComputedStyle(button, "::before").insetInlineEnd,
    );
    const visibleStartInset = Number.parseFloat(
      getComputedStyle(button, "::before").insetInlineStart,
    );
    return {
      hitAreaOverlap: buttonRect.right - checkboxRect.left,
      visibleGap: checkboxRect.left - (buttonRect.right - visibleInset),
      visibleStartInset,
    };
  });
  expect(hoverSpacing.hitAreaOverlap).toBeGreaterThan(0);
  expect(hoverSpacing.visibleGap).toBeGreaterThanOrEqual(3);
  expect(hoverSpacing.visibleStartInset).toBeGreaterThanOrEqual(2);
  expectStableGeometry(before, await taskGeometry(line));

  await trigger.click();
  const menu = page.locator(".mira-task-state-menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("radio")).toHaveCount(22);
  await expect(
    menu.getByRole("radio", { name: "Needs decision" }),
  ).toHaveAttribute("aria-checked", "true");
  expectStableGeometry(before, await taskGeometry(line));

  await menu.getByRole("radio", { name: "Starred" }).click();
  await expect(menu).toBeHidden();
  await expect(line).toHaveAttribute("data-task", "*");
  await expect(line.locator(".cm-task-checkbox")).toHaveAttribute(
    "data-task",
    "*",
  );
  expectStableGeometry(before, await taskGeometry(line));
});

test("the task-type picker stays off read-only and raw-source surfaces", async ({
  page,
}) => {
  await gotoStory(page, "markdown-task-states--preview");
  await expect(page.getByRole("checkbox", { name: "Toggle task" })).toHaveCount(
    6,
  );
  await expect(
    page.getByRole("button", { name: "Change task type" }),
  ).toHaveCount(0);

  await gotoStory(page, "markdown-task-states--source-mode");
  await expect(
    page.getByRole("button", { name: "Change task type" }),
  ).toHaveCount(0);
});

test("Comprehensive Live Preview exposes the task picker without changing its fixture", async ({
  page,
}) => {
  await gotoStory(page, "demo-comprehensive--live-preview");
  const taskLine = page
    .locator(".cm-task-line")
    .filter({ hasText: "Nested task continuation stays aligned" });
  await scrollEditorUntilVisible(page, taskLine);

  const trigger = taskLine.getByRole("button", { name: "Change task type" });
  await taskLine.hover();
  await expect(trigger).toHaveCSS("opacity", "1");
  await trigger.hover();
  await trigger.click();
  await expect(page.locator(".mira-task-state-menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".mira-task-state-menu")).toBeHidden();
});
