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
      entry.type === "docs" &&
      entry.title.startsWith("Mira MDE/Specification/"),
  );
  expect(specDocs).toHaveLength(10);
});

for (const view of views) {
  test(`renders the comprehensive ${view.id} view`, async ({ page }) => {
    await page.goto(
      `/iframe.html?id=demo-comprehensive--${view.id}&viewMode=story`,
    );
    await expect(page.locator(".mira-comprehensive")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Mira MDE", exact: true }),
    ).toBeVisible();
    const editorRoot = page.locator(
      `.mira-mde[data-mode="${view.id === "reading-preview" ? "preview" : view.id}"]`,
    );
    await expect(editorRoot).toBeVisible();
    await expect(
      editorRoot.locator(
        ":scope > .mira-mde__body > .mira-mde__pane--editor[data-visible='true']",
      ),
    ).toHaveCount(view.editor ? 1 : 0);
    await expect(
      editorRoot.locator(":scope > .mira-mde__body > .mira-mde__pane--preview"),
    ).toHaveCount(view.preview ? 1 : 0);
  });
}
