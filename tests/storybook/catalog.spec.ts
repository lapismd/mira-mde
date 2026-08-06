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
