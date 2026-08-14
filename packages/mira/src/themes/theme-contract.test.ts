import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

describe("Mira theme CSS contract", () => {
  it("keeps the Mira palette sentinels and defines both color modes", () => {
    const source = read("./_mira-palette.css");

    expect(source).toContain("light-dark(#fbfbfc, #17181c)");
    expect(source).toContain("light-dark(#0f766e, #2dd4bf)");
    expect(source).toContain("--mira-focus-ring: var(--mira-accent)");
    expect(source).toContain(
      "--mira-callout-default: var(--_mira-callout-default-light)",
    );
    expect(source).toContain('[data-mira-color-mode="dark"]');
    expect(source).not.toMatch(
      /--mira-callout-(?!background\b)[\w-]+:\s*light-dark\(/u,
    );
    expect(source).not.toMatch(/--mira-widget-shadow:\s*light-dark\(/u);
  });

  it("maps the distinct Lapis Obsidian palette", () => {
    const source = read("./_obsidian-palette.css");

    expect(source).toContain('data-mira-theme~="obsidian"');
    expect(source).toContain("light-dark(#ffffff, #1e1e1e)");
    expect(source).toContain("light-dark(#222222, #dadada)");
    expect(source).toContain("light-dark(hsl(257 88.88% 70.95%), #7852ee)");
    expect(source).toContain(
      "--mira-syntax-string: light-dark(#007a58, #53dfdd)",
    );
    expect(source).not.toContain("#008f67");
    expect(source).not.toContain("light-dark(#fbfbfc, #17181c)");
    expect(source).toContain(
      "--mira-callout-default: var(--_mira-callout-default-light)",
    );
    expect(source).toContain(
      '[data-mira-theme~="obsidian"][data-mira-color-mode="dark"]',
    );
    expect(source).not.toMatch(
      /--mira-callout-(?!background\b)[\w-]+:\s*light-dark\(/u,
    );
    expect(source).not.toMatch(/--mira-widget-shadow:\s*light-dark\(/u);
  });

  it("loads the contract, Mira fallback, and Obsidian override in order", () => {
    const source = read("../themes.css");
    const contract = source.indexOf("./themes/_contract.css");
    const mira = source.indexOf("./themes/_mira-palette.css");
    const obsidian = source.indexOf("./themes/_obsidian-palette.css");

    expect(contract).toBeGreaterThanOrEqual(0);
    expect(mira).toBeGreaterThan(contract);
    expect(obsidian).toBeGreaterThan(mira);
  });

  it("exports aggregate and individual theme entrypoints", () => {
    const manifest = JSON.parse(read("../../package.json")) as {
      exports: Record<string, unknown>;
    };

    expect(manifest.exports).toHaveProperty("./themes/mira.css");
    expect(manifest.exports).toHaveProperty("./themes/obsidian.css");
    expect(manifest.exports).toHaveProperty("./themes.css");
  });

  it("uses the theme-primary embed accent for blockquote guides", () => {
    const tokens = read("../preview/styles/tokens.css");
    const embeds = read("../preview/styles/links-embeds-tags.css");

    expect(tokens).toContain(
      "--blockquote-border-color: var(--interactive-accent)",
    );
    expect(embeds).toContain(
      "border-inline-start: 2px solid var(--interactive-accent)",
    );
  });

  it("exposes the complete Lapis-compatible per-level heading contract", () => {
    const contract = read("./_contract.css");
    const tokens = read("../preview/styles/tokens.css");
    const headings = read("../preview/styles/headings.css");
    const sizes = [
      "1.802em",
      "1.602em",
      "1.424em",
      "1.266em",
      "1.125em",
      "1em",
    ];
    const lineHeights = ["1.2", "1.2", "1.3", "1.4", "1.5", "1.5"];
    const weights = ["700", "600", "600", "600", "600", "600"];

    expect(contract).toContain("--mira-heading-color: var(--mira-foreground)");

    for (let index = 0; index < 6; index += 1) {
      const level = index + 1;

      expect(contract).toContain(
        `--mira-h${level}-color: var(--mira-heading-color)`,
      );
      expect(contract).toContain(
        `--mira-h${level}-font: var(--mira-font-sans)`,
      );
      expect(contract).toContain(`--mira-h${level}-size: ${sizes[index]}`);
      expect(contract).toContain(
        `--mira-h${level}-line-height: ${lineHeights[index]}`,
      );
      expect(contract).toContain(`--mira-h${level}-style: normal`);
      expect(contract).toContain(`--mira-h${level}-variant: normal`);
      expect(contract).toContain(`--mira-h${level}-weight: ${weights[index]}`);
      expect(tokens).toContain(
        `--h${level}-color: var(--mira-h${level}-color)`,
      );
      expect(tokens).toContain(
        `--h${level}-weight: var(--mira-h${level}-weight)`,
      );
    }

    expect(headings).toContain(".cm-heading:not(.cm-meta)");
    expect(headings).toContain("color: inherit");
    expect(headings).toContain("font-weight: inherit");
  });
});
