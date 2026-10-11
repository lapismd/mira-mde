// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cwd } from "node:process";
import { describe, expect, it } from "vitest";

const sourceModeStyles = () =>
  readFileSync(resolve(cwd(), "src/preview/styles/source-mode.css"), "utf8");

describe("source mode styles", () => {
  it("reserves full guide slots only for complete indentation guide segments", () => {
    const styles = sourceModeStyles();

    const guideRules = Array.from(styles.matchAll(/([^{}]+)\{([^{}]*)\}/gu))
      .map((match) => ({ selector: match[1]!, declarations: match[2]! }))
      .filter(({ declarations }) =>
        /min-width:\s*var\(--list-indent\)/u.test(declarations),
      );
    expect(guideRules).toHaveLength(1);
    for (const markup of [
      '<div class="markdown-editor-surface"><div class="cm-editor"><span class="cm-indent-guide"></span><span class="cm-indent"></span></div></div>',
      '<div class="cm-editor markdown-editor-surface"><span class="cm-indent-guide"></span><span class="cm-indent"></span></div>',
    ]) {
      const host = document.createElement("div");
      host.innerHTML = markup;
      const guide = host.querySelector(".cm-indent-guide")!;
      const partial = host.querySelector(".cm-indent")!;
      for (const { selector } of guideRules) {
        expect(guide.matches(selector.trim())).toBe(true);
        expect(partial.matches(selector.trim())).toBe(false);
      }
    }
  });
});
