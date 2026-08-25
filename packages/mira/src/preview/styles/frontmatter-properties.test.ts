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
  it("uses the legacy dropdown and nested type-menu structure", () => {
    expect(component).toContain(
      'import * as DropdownMenu from "../../ui/dropdown-menu/index.js";',
    );
    expect(component).toContain(
      '<DropdownMenu.Content\n      class="metadata-property-menu"',
    );
    expect(component).toContain("<DropdownMenu.SubTrigger>");
    expect(component).toContain("<span>Property type</span>");
    expect(component).toContain(
      '<DropdownMenu.SubContent\n            class="metadata-property-type-menu"',
    );
    expect(component).toContain("<DropdownMenu.CheckboxItem");
    expect(component).toContain(
      'class="metadata-property-type-menu__type-icon size-4"',
    );
    expect(component).not.toContain("metadata-property-type-menu__item");
    expect(component).not.toMatch(
      /class="metadata-property[^"\n]*\boverflow-hidden\b/u,
    );
    expect(css).toMatch(
      /\.metadata-property-menu,\s*\.metadata-property-type-menu\s*\{[^}]*--bits-dropdown-menu-content-available-height/su,
    );
  });
});
