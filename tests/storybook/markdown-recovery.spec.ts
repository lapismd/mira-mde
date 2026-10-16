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
