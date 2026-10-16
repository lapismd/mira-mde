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
  const spacing = await page
    .getByRole("button", { name: "Replace GitHub icon", exact: true })
    .evaluate(
      (button) =>
        button.nextElementSibling!.getBoundingClientRect().top -
        button.getBoundingClientRect().bottom,
    );
  expect(spacing).toBeGreaterThanOrEqual(12);
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
        "data-mira-theme",
        theme,
      );
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

test("reference definitions show authored names and reveal complete source through the standard toolbar", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=markdown-inline-links--live-preview&viewMode=story",
  );
  const configured = page.getByRole("region", { name: "Configured links" });
  const row = configured.locator(
    '.mira-reference-definition[data-reference-label="Forge Docs"]',
  );
  await row.scrollIntoViewIfNeeded();
  await expect(row.locator(".mira-reference__label")).toHaveText("Forge Docs");
  await expect(row.getByRole("link")).toHaveAttribute(
    "href",
    "https://codeberg.org/forgejo/forgejo",
  );
  await row.getByRole("button", { name: "Edit source", exact: true }).focus();
  await page.keyboard.press("Enter");
  const sourceLine = configured
    .locator(".cm-line")
    .filter({ hasText: "[Forge Docs]:" });
  await expect(sourceLine).toHaveText(
    "[Forge Docs]: https://codeberg.org/forgejo/forgejo",
  );
  await expect(sourceLine.locator(".cm-formatting-hidden")).toHaveCount(0);

  const options = configured.getByRole("button", {
    name: "View options",
    exact: true,
  });
  await expect(options.locator("svg")).toHaveCount(1);
  await options.click();
  await page
    .getByRole("menuitem", { name: "Source mode", exact: true })
    .click();
  await expect(configured.locator(".mira-reference-definition")).toHaveCount(0);
  await expect(configured.locator(".cm-content")).toContainText(
    "[Forge Docs]: https://codeberg.org/forgejo/forgejo",
  );
  await expect(configured.locator(".cm-content")).toContainText(
    "![Mira landscape][landscape]",
  );
  await options.click();
  await page
    .getByRole("menuitem", { name: "Reading view", exact: true })
    .click();
  await expect(
    configured.getByRole("link", { name: "Reference", exact: true }),
  ).toBeVisible();
  await expect(configured.locator(".mira-reference__label")).toHaveCount(0);
  await configured.getByRole("button", { name: "Split", exact: true }).click();
  await expect(configured.locator(".cm-content")).toBeVisible();
  await expect(
    configured.getByRole("link", { name: "Reference", exact: true }),
  ).toBeVisible();
});

test("reference image badges preserve definition case and fit narrow themed layouts", async ({
  page,
}) => {
  for (const colorMode of ["light", "dark"]) {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(
      `/iframe.html?id=markdown-inline-links--live-preview&viewMode=story&globals=colorMode:${colorMode}`,
    );
    const configured = page.getByRole("region", { name: "Configured links" });
    await expect(
      configured.getByRole("textbox", { name: "Markdown editor", exact: true }),
    ).toBeVisible();
    await configured
      .locator(".cm-scroller")
      .first()
      .evaluate((scroller) => {
        scroller.scrollTop = scroller.scrollHeight;
      });
    const usage = configured.locator(
      '.mira-rich-widget--image[data-reference-label="Landscape"]',
    );
    await usage.scrollIntoViewIfNeeded();
    await expect(usage.locator(".mira-reference__label")).toHaveText(
      "Landscape",
    );
    await expect(usage.locator("img")).toHaveAttribute("alt", "Mira landscape");
    await expect
      .poll(() =>
        usage
          .locator("img")
          .evaluate((image) => image.getBoundingClientRect().width),
      )
      .toBeGreaterThan(100);
    const definition = configured.locator(
      '.mira-reference-definition[data-reference-label="Landscape"]',
    );
    await definition.scrollIntoViewIfNeeded();
    await expect(definition.locator(".mira-reference__label")).toHaveText(
      "Landscape",
    );
    const geometry = await definition.evaluate((frame) => {
      const box = frame.getBoundingClientRect();
      const badge = frame
        .querySelector(".mira-reference__label")!
        .getBoundingClientRect();
      return {
        fits: badge.right <= box.right && badge.left >= box.left,
        border: getComputedStyle(frame).borderTopWidth,
      };
    });
    expect(geometry).toEqual({ fits: true, border: "1px" });
    const independent = page.getByRole("region", {
      name: "Independent default registry",
    });
    await expect(independent.locator(".markdown-preview-surface")).toHaveCount(
      0,
    );
    expect(
      await independent.evaluate(
        (element) => element.getBoundingClientRect().height,
      ),
    ).toBeLessThan(40);
  }
});
