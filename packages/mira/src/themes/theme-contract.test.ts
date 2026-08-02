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
  });

  it("maps the distinct Lapis Obsidian palette", () => {
    const source = read("./_obsidian-palette.css");

    expect(source).toContain('data-mira-theme~="obsidian"');
    expect(source).toContain("light-dark(#ffffff, #1e1e1e)");
    expect(source).toContain("light-dark(#222222, #dadada)");
    expect(source).toContain("light-dark(hsl(257 88.88% 70.95%), #7852ee)");
    expect(source).not.toContain("light-dark(#fbfbfc, #17181c)");
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
});
