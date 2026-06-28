import { expect, test } from "@playwright/test";

test("renders the documentation home page with a live editor", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Mira MDE" })).toBeVisible();
  await expect(page.locator(".docs-live-editor")).toBeVisible();
  await expect(
    page.locator(".docs-live-editor").first().locator(".cm-editor").first(),
  ).toBeVisible();
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
});

test("documents the supported Markdown feature set", async ({ page }) => {
  await page.goto("/markdown/");

  await expect(
    page.getByRole("heading", { name: "Supported Markdown" }),
  ).toBeVisible();
  await expect(
    page.getByText("Frontmatter", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Wikilinks", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Markdown embeds", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Grid tables", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Raw HTML", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Directives", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Footnotes", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Mermaid", { exact: true }).first(),
  ).toBeVisible();
});

test("renders table and Mermaid examples", async ({ page }) => {
  await page.goto("/tables/");
  await expect(page.locator(".docs-live-editor")).toBeVisible();
  await expect(page.locator("table").first()).toBeVisible();

  await page.goto("/mermaid/");
  await expect(page.locator(".docs-live-editor")).toBeVisible();
  await expect(page.locator("svg").first()).toBeVisible();
});
