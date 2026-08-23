import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cwd } from "node:process";
import { describe, expect, it } from "vitest";

const sourceModeStyles = () =>
  readFileSync(resolve(cwd(), "src/preview/styles/source-mode.css"), "utf8");

describe("source mode styles", () => {
  it("reserves full guide slots only for complete indentation guide segments", () => {
    const styles = sourceModeStyles();

    expect(styles).toContain(
      ".markdown-editor-surface .cm-editor .cm-indent-guide",
    );
    expect(styles).toContain("min-width: var(--list-indent)");
    expect(styles).not.toMatch(
      /\.markdown-editor-surface\s+\.cm-editor\s+\.cm-indent\s*\{[^}]*min-width:\s*var\(--list-indent\)/u,
    );
  });
});
