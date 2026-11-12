import { expect, test } from "@playwright/test";

test("scrolls a named Markdown region by native keyboard and removes its spare tab stop when it fits", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=markdown-embeds--keyboard-scrolling&viewMode=story",
  );
  const region = page.getByRole("region", {
    name: "Markdown preview: Scroll.md",
  });
  await expect(region).toHaveAttribute("tabindex", "0");
  await region.focus();
  await expect(region).toBeFocused();
  await page.keyboard.press("PageDown");
  await expect
    .poll(() => region.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  const preview = page.locator(".mira-markdown-preview");
  await page.getByRole("button", { name: "Expand preview" }).click();
  await expect(preview).not.toHaveAttribute("tabindex");
  await expect(preview).not.toHaveAttribute("role");
});
