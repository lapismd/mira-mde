import { expect, test } from "@playwright/test";

const views = [
  { id: "live-preview", editor: true, preview: false },
  { id: "source", editor: true, preview: false },
  { id: "reading-preview", editor: false, preview: true },
  { id: "split", editor: true, preview: true },
] as const;

test("publishes one docs mirror for every canonical specification chapter", async ({
  request,
}) => {
  const response = await request.get("/index.json");
  expect(response.ok()).toBeTruthy();
  const index = (await response.json()) as {
    entries: Record<string, { id: string; title: string; type: string }>;
  };
  const specDocs = Object.values(index.entries).filter(
    (entry) =>
      entry.type === "docs" && entry.title.startsWith("Mira/Specification/"),
  );
  expect(specDocs).toHaveLength(11);

  const catalogDocs = Object.values(index.entries).filter(
    (entry) => entry.type === "docs" && entry.title.startsWith("Mira/Catalog/"),
  );
  expect(catalogDocs).toHaveLength(8);
});

test("publishes catalog descriptions, spec links, and token metadata", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=mira-catalog-editor-surfaces--docs&viewMode=docs",
  );
  await expect(
    page.getByRole("heading", { name: "Mira", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /governing specification/i }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("rowheader", { name: "--mira-editor-background" }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Available stable Mira CSS tokens").first(),
  ).toBeVisible();

  await page.goto(
    "/iframe.html?id=mira-specification-architecture-and-boundaries--docs&viewMode=docs",
  );
  await expect(
    page.getByRole("heading", { name: "Architecture and Boundaries" }),
  ).toBeVisible();
  await expect(page.getByText("MIRA-ARCH-005")).toBeVisible();
});

for (const view of views) {
  test(`renders the comprehensive ${view.id} view`, async ({ page }) => {
    await page.goto(
      `/iframe.html?id=demo-comprehensive--${view.id}&viewMode=story`,
    );
    await expect(page.locator(".mira-comprehensive")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Mira", exact: true }),
    ).toBeVisible();
    const editorRoot = page.locator(
      `.mira[data-mode="${view.id === "reading-preview" ? "preview" : view.id}"]`,
    );
    await expect(editorRoot).toBeVisible();
    await expect(
      editorRoot.locator(
        ":scope > .mira__body > .mira__pane--editor[data-visible='true']",
      ),
    ).toHaveCount(view.editor ? 1 : 0);
    await expect(
      editorRoot.locator(":scope > .mira__body > .mira__pane--preview"),
    ).toHaveCount(view.preview ? 1 : 0);
  });
}

test("the comprehensive demo enables every first-party plugin and contextual toolbar", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=demo-comprehensive--live-preview&viewMode=story",
  );
  const root = page.locator(".mira-comprehensive");
  await expect(root).toHaveAttribute(
    "data-mira-comprehensive-extensions",
    "selection-toolbar doodle-dividers",
  );
  await expect(root).toHaveAttribute(
    "data-mira-comprehensive-plugins",
    "ai mermaid",
  );
  await expect(
    root.locator(".cm-editor.mira-block-toolbar-enabled"),
  ).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Ask AI" })).toBeEnabled();

  const content = root.locator(".cm-content");
  await content.focus();
  await page.keyboard.down("Shift");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.up("Shift");
  await expect(
    page.getByRole("toolbar", { name: "Text formatting" }),
  ).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(
    page.getByRole("toolbar", { name: "Text formatting" }),
  ).toHaveCount(0);

  await page.goto(
    "/iframe.html?id=demo-comprehensive--composable&viewMode=story",
  );
  const composable = page.locator(".mira-comprehensive");
  await expect(
    composable.locator(".cm-editor.mira-block-toolbar-enabled"),
  ).toHaveCount(1);
  const composableContent = composable.locator(".cm-content");
  await composableContent.focus();
  await page.keyboard.press("Control+End");
  await page.keyboard.type("\n/ask");
  await expect(page.getByRole("option", { name: /Ask AI/ })).toBeVisible();
});

test("Live Preview doodle dividers reroll and select a family beside the source control", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=markdown-dividers--live-preview&viewMode=story",
  );
  const editor = page.locator(".mira-story-surface--editor");
  await expect(editor).toBeVisible();

  type RectState = {
    height: number;
    width: number;
    x: number;
    y: number;
  };
  type DividerState = {
    contentBox: RectState | null;
    pickerBox: RectState | null;
    refreshBox: RectState | null;
    sourceBox: RectState | null;
    state: string;
  };

  let dividerState: DividerState = {
    contentBox: null,
    pickerBox: null,
    refreshBox: null,
    sourceBox: null,
    state: "pending",
  };
  await expect
    .poll(
      async () => {
        dividerState = await editor.evaluate((root): DividerState => {
          const rect = (element: Element | null): RectState | null => {
            if (!element) return null;
            const box = element.getBoundingClientRect();
            if (box.width === 0 && box.height === 0) return null;
            return {
              height: box.height,
              width: box.width,
              x: box.x,
              y: box.y,
            };
          };
          const widget = Array.from(
            root.querySelectorAll<HTMLElement>(
              ".mira-rich-widget--horizontalrule",
            ),
          ).find(
            (candidate) =>
              candidate.querySelector("svg.mira-doodle-divider[data-seed]") &&
              rect(candidate),
          );
          if (!widget) {
            return {
              contentBox: null,
              pickerBox: null,
              refreshBox: null,
              sourceBox: null,
              state: "missing seeded widget",
            };
          }

          const sourceBox = rect(
            widget.querySelector('button[aria-label="Edit source"]'),
          );
          const refreshBox = rect(
            widget.querySelector('button[aria-label="Refresh divider style"]'),
          );
          const pickerBox = rect(
            widget.querySelector('button[aria-label="Choose divider style"]'),
          );
          const contentBox = rect(root.querySelector(".cm-content"));
          if (!sourceBox) {
            return {
              contentBox,
              pickerBox,
              refreshBox,
              sourceBox,
              state: "missing source box",
            };
          }
          if (!refreshBox) {
            return {
              contentBox,
              pickerBox,
              refreshBox,
              sourceBox,
              state: "missing refresh box",
            };
          }
          if (!pickerBox) {
            return {
              contentBox,
              pickerBox,
              refreshBox,
              sourceBox,
              state: "missing picker box",
            };
          }
          if (!contentBox) {
            return {
              contentBox,
              pickerBox,
              refreshBox,
              sourceBox,
              state: "missing content box",
            };
          }
          return {
            contentBox,
            pickerBox,
            refreshBox,
            sourceBox,
            state: "ok",
          };
        });
        return dividerState.state;
      },
      {
        message: "seeded divider controls should settle in the editor surface",
      },
    )
    .toBe("ok");

  const { contentBox, pickerBox, refreshBox, sourceBox } = dividerState;
  expect(sourceBox).not.toBeNull();
  expect(refreshBox).not.toBeNull();
  expect(pickerBox).not.toBeNull();
  expect(contentBox).not.toBeNull();
  expect(Math.abs(sourceBox!.y - refreshBox!.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(refreshBox!.y - pickerBox!.y)).toBeLessThanOrEqual(1);
  expect(sourceBox!.x - (refreshBox!.x + refreshBox!.width)).toBeGreaterThan(2);
  expect(sourceBox!.x - (refreshBox!.x + refreshBox!.width)).toBeLessThan(6);

  await expect
    .poll(
      async () =>
        editor.evaluate((root) => {
          const widget = Array.from(
            root.querySelectorAll<HTMLElement>(
              ".mira-rich-widget--horizontalrule",
            ),
          ).find((candidate) =>
            candidate.querySelector("svg.mira-doodle-divider[data-seed]"),
          );
          const trigger = widget?.querySelector<HTMLButtonElement>(
            'button[aria-label="Choose divider style"]',
          );
          const menu = widget?.querySelector<HTMLElement>(
            '[role="menu"][aria-label="Divider style"]',
          );
          if (!trigger || !menu) return "missing:0:0";
          if (menu.hidden) {
            trigger.click();
          }
          const items = Array.from(
            menu.querySelectorAll('[role="menuitemradio"]'),
          );
          const currentItems = items.filter(
            (item) => item.getAttribute("aria-checked") === "true",
          );
          return `${menu.hidden ? "closed" : "open"}:${items.length}:${currentItems.length}`;
        }),
      { message: "divider style menu should open from the widget trigger" },
    )
    .toBe("open:8:1");
  await editor.evaluate((root) => {
    const widget = Array.from(
      root.querySelectorAll<HTMLElement>(".mira-rich-widget--horizontalrule"),
    ).find((candidate) =>
      candidate.querySelector("svg.mira-doodle-divider[data-seed]"),
    );
    const item = Array.from(
      widget?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ??
        [],
    ).find((candidate) => candidate.textContent?.trim() === "Scribble");
    if (!item) {
      throw new Error("Scribble divider menu item was not found");
    }
    item.click();
  });

  await expect
    .poll(() =>
      editor.evaluate((root) => {
        const widget = Array.from(
          root.querySelectorAll<HTMLElement>(
            ".mira-rich-widget--horizontalrule",
          ),
        ).find((candidate) =>
          candidate.querySelector("svg.mira-doodle-divider[data-seed]"),
        );
        return (
          widget
            ?.querySelector("svg.mira-doodle-divider")
            ?.getAttribute("data-variant") ?? null
        );
      }),
    )
    .toBe("scribble");

  const selectedSeed = await editor.evaluate((root) => {
    const widget = Array.from(
      root.querySelectorAll<HTMLElement>(".mira-rich-widget--horizontalrule"),
    ).find((candidate) =>
      candidate.querySelector("svg.mira-doodle-divider[data-seed]"),
    );
    return (
      widget
        ?.querySelector("svg.mira-doodle-divider")
        ?.getAttribute("data-seed") ?? null
    );
  });
  const selectedVariant = await editor.evaluate((root) => {
    const widget = Array.from(
      root.querySelectorAll<HTMLElement>(".mira-rich-widget--horizontalrule"),
    ).find((candidate) =>
      candidate.querySelector("svg.mira-doodle-divider[data-seed]"),
    );
    return (
      widget
        ?.querySelector("svg.mira-doodle-divider")
        ?.getAttribute("data-variant") ?? null
    );
  });
  const contentX = await editor.evaluate(
    (root) => root.querySelector(".cm-content")?.getBoundingClientRect().x,
  );
  expect(selectedVariant).toBe("scribble");
  expect(selectedSeed).toMatch(/^[0-9a-f]{8}$/u);
  await expect(editor).toHaveAttribute(
    "data-markdown-value",
    new RegExp(`mira-divider:v1:${selectedSeed}`),
  );
  expect(contentX).toBe(contentBox!.x);

  await editor.evaluate((root) => {
    const widget = Array.from(
      root.querySelectorAll<HTMLElement>(".mira-rich-widget--horizontalrule"),
    ).find((candidate) =>
      candidate.querySelector("svg.mira-doodle-divider[data-seed]"),
    );
    const refresh = widget?.querySelector<HTMLButtonElement>(
      'button[aria-label="Refresh divider style"]',
    );
    if (!refresh) {
      throw new Error("Refresh divider style control was not found");
    }
    refresh.click();
  });
  await expect
    .poll(() =>
      editor.evaluate((root) => {
        const widget = Array.from(
          root.querySelectorAll<HTMLElement>(
            ".mira-rich-widget--horizontalrule",
          ),
        ).find((candidate) =>
          candidate.querySelector("svg.mira-doodle-divider[data-seed]"),
        );
        return (
          widget
            ?.querySelector("svg.mira-doodle-divider")
            ?.getAttribute("data-variant") ?? null
        );
      }),
    )
    .not.toBe(selectedVariant);

  await page.goto("/iframe.html?id=markdown-dividers--reading&viewMode=story");
  await expect(
    page.getByRole("button", { name: "Refresh divider style" }),
  ).toHaveCount(0);
  await page.goto("/iframe.html?id=markdown-dividers--source&viewMode=story");
  await expect(
    page.getByRole("button", { name: "Refresh divider style" }),
  ).toHaveCount(0);
});

test("the narrow main toolbar scrolls without scrollbar chrome", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=mira-editor-features--narrow-scrollable-toolbar&viewMode=story",
  );
  const toolbar = page.getByRole("toolbar", {
    name: "Markdown editor toolbar",
  });
  await expect(toolbar).toBeVisible();
  await expect
    .poll(() =>
      toolbar.evaluate((element) => element.scrollWidth > element.clientWidth),
    )
    .toBe(true);
  await expect
    .poll(() =>
      toolbar.evaluate((element) => ({
        overflowX: getComputedStyle(element).overflowX,
        overflowY: getComputedStyle(element).overflowY,
        scrollbarWidth: getComputedStyle(element).scrollbarWidth,
        touchAction: getComputedStyle(element).touchAction,
      })),
    )
    .toEqual({
      overflowX: "auto",
      overflowY: "hidden",
      scrollbarWidth: "none",
      touchAction: "pan-x",
    });

  await toolbar.evaluate((element) => {
    element.scrollLeft = 0;
  });
  await toolbar.hover();
  await page.mouse.wheel(240, 0);
  await expect
    .poll(() => toolbar.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0);

  const toolbarItems = toolbar.locator("[data-toolbar-item]");
  const firstButton = toolbarItems.first();
  const lastToolbarItem = toolbarItems.last();
  const finalButton = toolbar.getByRole("button", { name: "View options" });
  await firstButton.focus();
  await page.keyboard.press("End");
  await expect(lastToolbarItem).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(finalButton).toBeFocused();
  await expect
    .poll(() => toolbar.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0);
  await page.keyboard.press("Shift+Tab");
  await expect(lastToolbarItem).toBeFocused();
  await page.keyboard.press("Home");
  await expect(firstButton).toBeFocused();
  await expect
    .poll(() => toolbar.evaluate((element) => element.scrollLeft))
    .toBeLessThan(2);
});

test("the narrow main toolbar exposes coarse-pointer touch targets", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:7007",
    hasTouch: true,
    isMobile: true,
    viewport: { width: 360, height: 740 },
  });
  const page = await context.newPage();
  try {
    await page.goto(
      "/iframe.html?id=mira-editor-features--narrow-scrollable-toolbar&viewMode=story",
    );
    const toolbar = page.getByRole("toolbar", {
      name: "Markdown editor toolbar",
    });
    const firstButton = toolbar.getByRole("button").first();
    await expect(toolbar).toBeVisible();
    await expect
      .poll(async () => {
        const box = await firstButton.boundingBox();
        return box ? Math.min(box.width, box.height) : 0;
      })
      .toBeGreaterThanOrEqual(44);
    await expect
      .poll(() => toolbar.evaluate((element) => element.clientHeight))
      .toBeGreaterThanOrEqual(52);
  } finally {
    await context.close();
  }
});
