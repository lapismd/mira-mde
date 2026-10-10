import { expect, test } from "@playwright/test";

test("Bare CodeMirror list bullets retain editable source markers", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=markdown-indentation--bare-code-mirror-live-preview&viewMode=story",
  );
  const editor = page.getByRole("textbox", { name: "Markdown editor" });
  const marker = editor
    .locator(".cm-formatting-list-bullet > .cm-meta")
    .first();
  await expect(marker).toHaveText("-");
  await marker.click();
  const active = editor.locator(
    ".cm-activeLine .cm-formatting-list-ul > .cm-meta",
  );
  await expect(active).toHaveText("-");
  await expect(active.locator("..")).not.toHaveClass(
    /cm-formatting-list-bullet/,
  );
  await expect
    .poll(() =>
      active.evaluate((element) => ({
        color: getComputedStyle(element).color,
        paint: getComputedStyle(element, "::after").content,
      })),
    )
    .toEqual({
      color: expect.not.stringMatching(/^rgba\(0, 0, 0, 0\)$/),
      paint: "none",
    });
  await editor.press("ArrowRight");
  await editor.press("ArrowRight");
  // CodeMirror may split a formatting decoration into adjacent spans at the
  // caret. Count the painted marker glyphs, as the initial story does.
  await expect(
    editor.locator(".cm-formatting-list-bullet > .cm-meta"),
  ).toHaveCount(3);
});
