import { expect, test } from "@playwright/test";

test("inline links retain accessible labels, keyboard tooltips and independent overrides without network", async ({
  page,
}) => {
  const external: string[] = [];
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/u, (route) => {
    external.push(route.request().url());
    return route.abort();
  });
  await page.goto(
    "/iframe.html?id=markdown-inline-links--default&viewMode=story",
  );
  const configured = page.getByRole("region", { name: "Configured links" });
  const link = configured.getByRole("link", { name: "issue #42", exact: true });
  await expect(link).toBeVisible();
  await expect(link.locator("svg")).toHaveCount(1);
  await expect(link.locator("svg")).toHaveAttribute("viewBox", "0 0 24 24");
  await expect(link.locator("strong")).toHaveText("issue");
  await expect(link).toHaveCSS("background-image", "none");
  const ordinary = page.getByRole("link", { name: "Ordinary Mira link" });
  await expect(link).toHaveCSS(
    "color",
    await ordinary.evaluate((element) => getComputedStyle(element).color),
  );
  await link.focus();
  await expect(page.getByRole("tooltip")).toContainText(
    "https://github.com/lapismd/mira-mde/issues/42",
  );
  await page.keyboard.press("Escape");
  const independent = page
    .getByRole("region", { name: "Independent default registry" })
    .locator("svg path");
  const original = await independent.getAttribute("d");
  await page.getByRole("button", { name: "Replace GitHub icon" }).click();
  await expect(link.locator("svg path")).toHaveAttribute(
    "d",
    "M0 0L10 0L5 10Z",
  );
  await expect(independent).toHaveAttribute("d", original!);
  await expect(link.locator("svg")).toHaveAttribute("viewBox", "0 0 10 10");
  await expect(
    configured.getByRole("link", { name: "Private docs" }).locator("svg"),
  ).toHaveAttribute("data-link-site", "company");
  expect(external).toEqual([]);
});

test("live-preview icons survive reconfiguration, render in tables and return to source", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=markdown-inline-links--live-preview&viewMode=story",
  );
  const configured = page.getByRole("region", { name: "Configured links" });
  const link = configured.getByRole("link", { name: "issue #42", exact: true });
  await expect(link).toBeVisible();
  await expect(
    configured
      .getByRole("link", { name: "Table issue", exact: true })
      .locator("svg"),
  ).toHaveAttribute("data-link-site", "github");
  await expect(
    configured.getByRole("link", { name: "Grid", exact: true }).locator("svg"),
  ).toHaveAttribute("data-link-site", "gitlab");
  await page.getByRole("button", { name: "Replace GitHub icon" }).click();
  await expect(link.locator("svg path")).toHaveAttribute(
    "d",
    "M0 0L10 0L5 10Z",
  );
  await link.click();
  await expect(configured.locator(".cm-content").first()).toContainText(
    "[**issue** #42](https://github.com/lapismd/mira-mde/issues/42)",
  );
});

test("inline links inherit Mira palette and color-mode controls", async ({
  page,
}) => {
  for (const theme of ["mira", "obsidian"]) {
    for (const colorMode of ["light", "dark"]) {
      await page.goto(
        `/iframe.html?id=markdown-inline-links--default&viewMode=story&globals=theme:${theme};colorMode:${colorMode}`,
      );
      const inline = page
        .getByRole("region", { name: "Configured links" })
        .getByRole("link", { name: "issue #42", exact: true });
      const ordinary = page.getByRole("link", { name: "Ordinary Mira link" });
      await expect(inline).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute(
        "data-mira-color-mode",
        colorMode,
      );
      await expect(inline).toHaveCSS(
        "color",
        await ordinary.evaluate((element) => getComputedStyle(element).color),
      );
      await expect(inline.locator("svg")).toHaveAttribute(
        "viewBox",
        "0 0 24 24",
      );
    }
  }
});

test("source mode retains Markdown and no source-editor icon widgets", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=markdown-inline-links--source&viewMode=story",
  );
  const configured = page.getByRole("region", { name: "Configured links" });
  await expect(configured.locator(".cm-content").first()).toContainText(
    "[**issue** #42]",
  );
  await expect(configured.locator(".mira-link-site-icon")).toHaveCount(0);
  const taggedLabel = configured.locator(".cm-hashtag > .cm-link");
  await expect(taggedLabel).toHaveCSS(
    "color",
    await taggedLabel.evaluate(
      (element) => getComputedStyle(element.parentElement!).color,
    ),
  );
});
