import { expect, test } from "@playwright/test";

test("native typing replaces the complete preview document after protected recovery", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(
    "/iframe.html?id=markdown-embeds--bound-recovery&viewMode=story",
  );
  await expect(
    page.getByRole("button", { name: "Edit Original", exact: true }),
  ).toContainText("Retained draft after detach.");
  await expect(page.getByLabel("Bound sessions")).toHaveText("1");
  await page
    .getByRole("button", { name: "Edit Original", exact: true })
    .click();
  const content = page.locator(".cm-content");
  await content.press("ControlOrMeta+a");
  await page.keyboard.type("Native replacement after recovery.");
  await expect(page.getByLabel("Draft Markdown")).toHaveText(
    "Native replacement after recovery.",
  );
  await expect(page.getByLabel("Disk Markdown")).toHaveText(
    "Native replacement after recovery.",
  );
  expect(errors).toEqual([]);
});

test("an internal link retains recovery authority and saves an empty document before later input", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(
    "/iframe.html?id=markdown-embeds--internal-link-recovery&viewMode=story",
  );
  const content = page.locator("[data-mira-link-preview-content] .cm-content");
  await expect(content).toHaveText("Failed internal link draft.");
  await expect(page.getByLabel("Bound sessions")).toHaveText("1");
  await page
    .getByRole("button", { name: "Protect recovery", exact: true })
    .click();
  await expect(page.getByLabel("Recovery status")).toHaveText("Protected");
  await expect(content).toHaveAttribute("contenteditable", "false");
  await page
    .getByRole("button", { name: "Use external content", exact: true })
    .click();
  await expect(page.getByLabel("Recovery status")).toHaveText("Ready");
  await page.getByRole("button", { name: "Original", exact: true }).hover();
  await page
    .getByRole("button", { name: "Edit Original", exact: true })
    .click();
  await expect(content).toContainText("Reviewed disk content.");
  await expect(content).toHaveAttribute("contenteditable", "true");
  await content.press("ControlOrMeta+a");
  await content.press("Backspace");
  await expect(page.getByLabel("Draft Markdown")).toHaveText("");
  await expect(page.getByLabel("Disk Markdown")).toHaveText("");
  await expect(content).toHaveText("");
  await expect(content).toHaveAttribute("contenteditable", "true");
  await page.keyboard.type("Saved internal link after recovery.");
  await expect(content).toHaveText("Saved internal link after recovery.");
  await expect(page.getByLabel("Disk Markdown")).toHaveText(
    "Saved internal link after recovery.",
  );
  await expect(page.getByLabel("Bound sessions")).toHaveText("1");
  expect(errors).toEqual([]);
});
