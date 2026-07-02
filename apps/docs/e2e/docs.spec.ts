import { expect, test } from "@playwright/test";

test("renders the documentation home page with a preview editor", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Mira MDE" })).toBeVisible();
  const example = page.locator(".docs-live-editor").first();
  await expect(example).toBeVisible();
  await expect(example.locator(".mira-default-ui")).toHaveAttribute(
    "data-mode",
    "preview",
  );
  await expect(example.locator(".markdown-reading-view").first()).toBeVisible();
  await expect(example.locator(".docs-live-editor__reset")).toHaveCount(0);
});

test("renders toolbar docs with custom toolbar actions", async ({ page }) => {
  await page.goto("/toolbar/");

  await expect(
    page.getByRole("heading", { name: "Toolbar", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Insert tip" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Insert template" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reset example" }),
  ).toBeVisible();
  await expect(page.locator(".docs-live-editor__reset")).toHaveCount(0);
});

test("renders slash commands from the custom popover", async ({ page }) => {
  await page.goto("/default-editor/");

  const example = page.locator(".docs-live-editor").last();
  await expect(example.locator(".mira-default-ui")).toHaveAttribute(
    "data-mode",
    "live-preview",
  );

  await example.locator(".cm-content").click();
  await page.keyboard.type("/h");
  await expect(example.locator(".mira-slash-menu")).toBeVisible();
  await expect(
    example.locator(".mira-slash-menu__item-title", { hasText: "Heading 1" }),
  ).toBeVisible();

  await page.keyboard.press("Enter");
  await page.keyboard.type("Draft title");

  await expect(example.locator(".mira-slash-menu")).toHaveCount(0);
  await expect(example.locator(".cm-content")).toContainText("# Draft title");
});

test("does not render slash commands for URLs, paths, or prose", async ({
  page,
}) => {
  for (const text of ["https://", "notes/", "word /"]) {
    await page.goto("/default-editor/");
    const example = page.locator(".docs-live-editor").last();

    await example.locator(".cm-content").click();
    await page.keyboard.type(text);

    await expect(example.locator(".mira-slash-menu")).toHaveCount(0);
  }
});

test("documents the supported Markdown feature set", async ({ page }) => {
  await page.goto("/markdown/");

  await expect(
    page.getByRole("heading", { name: "Markdown", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Frontmatter" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Wikilinks" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Markdown embeds" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Grid tables" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Raw HTML" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Directives" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Footnotes" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Mermaid" }).first(),
  ).toBeVisible();
});

test("renders focused Markdown feature examples", async ({ page }) => {
  await page.goto("/markdown/frontmatter/");
  await expect(page.locator(".docs-live-editor")).toBeVisible();
  await expect(page.locator(".mira-default-ui")).toHaveAttribute(
    "data-mode",
    "preview",
  );

  await page.goto("/markdown/grid-tables/");
  await expect(page.locator(".docs-live-editor")).toBeVisible();
  await expect(page.locator(".mira-default-ui")).toHaveAttribute(
    "data-mode",
    "preview",
  );
  await expect(page.locator("table").first()).toBeVisible();

  await page.goto("/markdown/mermaid/");
  await expect(page.locator(".docs-live-editor")).toBeVisible();
  await expect(page.locator(".mira-default-ui")).toHaveAttribute(
    "data-mode",
    "preview",
  );
  await expect(page.locator("svg").first()).toBeVisible();
});

test("redirects old table and Mermaid docs URLs", async ({ page }) => {
  await page.goto("/tables/");
  await expect(page).toHaveURL(/\/markdown\/tables\/?$/);
  await expect(
    page.getByRole("heading", { name: "Tables", exact: true }),
  ).toBeVisible();

  await page.goto("/mermaid/");
  await expect(page).toHaveURL(/\/markdown\/mermaid\/?$/);
  await expect(
    page.getByRole("heading", { name: "Mermaid", exact: true }),
  ).toBeVisible();
});
