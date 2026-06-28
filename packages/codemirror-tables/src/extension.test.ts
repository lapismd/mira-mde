import { describe, expect, it } from "vitest";
import { tableExtension } from "./extension";

describe("table extension", () => {
  it("resolves extension facets for configured keymaps", () => {
    expect(tableExtension({ bindEnter: false, bindTab: false })).toHaveLength(2);
  });
});
