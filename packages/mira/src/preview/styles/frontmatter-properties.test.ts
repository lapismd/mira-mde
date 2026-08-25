import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cwd } from "node:process";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  resolve(cwd(), "src/preview/styles/frontmatter-properties.css"),
  "utf8",
);
const component = readFileSync(
  resolve(cwd(), "src/preview/components/frontmatter.svelte"),
  "utf8",
);

describe("frontmatter property styles", () => {
  it("portals the type menu beyond property and workspace clipping", () => {
    expect(component).toContain(
      'import * as Popover from "../../ui/popover/index.js";',
    );
    expect(component).toContain(
      '<Popover.Content\n      class="metadata-property-type-menu w-44 p-1"',
    );
    expect(component).not.toMatch(
      /class="metadata-property[^"\n]*\boverflow-hidden\b/u,
    );
    expect(css).not.toMatch(
      /\.metadata-property-type-menu\s*\{[^}]*position:\s*absolute;/su,
    );
    expect(css).toMatch(
      /\.metadata-property-type-menu\s*\{[^}]*max-height:\s*var\(--bits-popover-content-available-height\);[^}]*overflow-y:\s*auto;/su,
    );
  });
});
