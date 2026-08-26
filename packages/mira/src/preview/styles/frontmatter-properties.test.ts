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
const listValueComponent = readFileSync(
  resolve(
    cwd(),
    "src/preview/components/frontmatter-property-value-input.svelte",
  ),
  "utf8",
);
const textValueComponent = readFileSync(
  resolve(
    cwd(),
    "src/preview/components/frontmatter-property-text-input.svelte",
  ),
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

  it("ships pill paint and remove-icon geometry without consumer utilities", () => {
    expect(component).toContain(
      "data-property-pill-kind={toBuiltinFrontmatterKind(property.kind)}",
    );
    expect(component).toContain('<Icon name="x" />');
    expect(component).not.toContain("[&_svg]:size-2.5");
    expect(css).toMatch(
      /\.metadata-property-pill-chip:not\(\.tag\)\s*\{[^}]*--markdown-alias-background[^}]*--secondary/su,
    );
    expect(css).toMatch(
      /\.metadata-property-pill-remove \.mira-icon,[^{]+\{[^}]*height: 0\.625rem[^}]*width: 0\.625rem/su,
    );
    expect(component).toContain('class="metadata-property-pill-label"');
    expect(css).toMatch(
      /\.metadata-property-value-list\s*\{[^}]*flex-wrap:\s*wrap[^}]*min-width:\s*0/su,
    );
    expect(css).toMatch(
      /\.metadata-property-pill-chip\s*\{[^}]*overflow-wrap:\s*anywhere[^}]*white-space:\s*normal/su,
    );
    expect(css).toMatch(
      /\.metadata-property-pill-chip\s*\{[^}]*flex:\s*0 0 auto/su,
    );
    expect(css).toMatch(
      /\.metadata-property-pill-label,[^{]+\{[^}]*text-overflow:\s*clip[^}]*white-space:\s*normal[^}]*width:\s*max-content/su,
    );
    expect(css).toMatch(
      /\.metadata-property-pill-link \.mira-link-preview__trigger\s*\{[^}]*display:\s*inline-block[^}]*white-space:\s*normal[^}]*width:\s*max-content/su,
    );
    expect(css).toMatch(
      /\.metadata-property-value-list \.metadata-property-pill-chip\.tag\s*\{[^}]*border-radius:\s*var\(--radius-s\)/su,
    );
  });

  it("portals list and text value suggestions through Mira Popover", () => {
    for (const source of [listValueComponent, textValueComponent]) {
      expect(source).toContain(
        'import * as Popover from "../../ui/popover/index.js";',
      );
      expect(source).toContain("<Popover.Root bind:open>");
      expect(source).toContain('class="mira-property-value-suggestions"');
      expect(source).toContain('role="listbox"');
    }
    expect(component).toContain("<FrontmatterPropertyTextInput");
    expect(component).toContain("const fallbackManager = $derived(");
    expect(component).toContain(
      "(controllerProp ? controllerProp.propertyManager : fallbackManager)",
    );
    expect(css).toContain(
      '[data-slot="popover-content"].mira-property-value-suggestions',
    );
    expect(css).not.toContain(
      '.metadata-property:has(.mira-property-value-input[data-open="true"])',
    );
    expect(listValueComponent).toContain('let draft = $state("");');
    expect(listValueComponent).not.toContain("onInput:");
    expect(listValueComponent).toContain('type="text"');
    expect(listValueComponent).toContain("...textControlProps(props)");
    for (const source of [listValueComponent, textValueComponent]) {
      expect(source).toContain("let activeIndex = $state(-1);");
      expect(source).toContain("activeIndex >= 0");
    }
  });
});
