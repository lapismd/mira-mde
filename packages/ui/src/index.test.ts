import { describe, expect, it } from "vitest";
import { cn } from ".";

describe("cn", () => {
  it("merges class values", () => {
    expect(cn("a", false, "b")).toBe("a b");
  });
});
