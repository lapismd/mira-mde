import { expect, test } from "@playwright/test";

test("property-menu teardown cancels deferred layer registration", async ({
  page,
}) => {
  const diagnostics: string[] = [];
  page.on("console", (message) => {
    if (/\[svelte\]|svelte\.dev\/e\//u.test(message.text()))
      diagnostics.push(message.text());
  });
  page.on("pageerror", (error) => diagnostics.push(error.message));
  await page.goto(
    "/iframe.html?id=ui-primitives-verification--pending-overlay-teardown&viewMode=story",
  );
  await expect
    .poll(
      async () =>
        diagnostics.length > 0 ||
        (await page.getByRole("status").textContent()) ===
          "Completed teardown: 3",
    )
    .toBe(true);
  expect(diagnostics).toEqual([]);
  await expect(page.getByRole("status")).toHaveText("Completed teardown: 3");
  await expect(page.locator('[data-slot="dropdown-menu-content"]')).toHaveCount(
    0,
  );
});
