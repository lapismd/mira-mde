import { describe, expect, it } from "vitest";
import { remarkWikiLinks } from "./remark";

describe("preview exports", () => {
  it("exports built-in remark plugins", () => {
    expect(typeof remarkWikiLinks).toBe("function");
  });
});
