import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

describe("Mira UI style boundaries", () => {
  it("scopes dialog overlay paint to Mira-owned overlays", () => {
    const styles = readSource("./styles.css");
    const overlay = readSource("./dialog/dialog-overlay.svelte");

    expect(styles).toContain('[data-mira-overlay][data-slot="dialog-overlay"]');
    expect(styles).not.toMatch(
      /(?:^|\n)\[data-slot="dialog-(?:overlay|content|title|description|header|footer)"\]/u,
    );
    expect(overlay).toContain("data-mira-overlay");
  });
});
