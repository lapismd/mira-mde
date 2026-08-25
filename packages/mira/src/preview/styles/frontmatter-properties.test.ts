import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cwd } from "node:process";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  resolve(cwd(), "src/preview/styles/frontmatter-properties.css"),
  "utf8",
);

describe("frontmatter property styles", () => {
  it("lets an open type menu escape its otherwise clipped property row", () => {
    expect(css).toMatch(
      /\.metadata-property:has\(\.metadata-property-type-menu\)\s*\{[^}]*overflow:\s*visible;[^}]*z-index:\s*5;/su,
    );
  });
});
