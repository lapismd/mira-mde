import { describe, expect, it } from "vitest";
import {
  miraColorModeAttribute,
  miraColorModeClassName,
  normalizeMiraTheme,
} from "./appearance-context";

describe("Mira appearance attributes", () => {
  it("passes arbitrary theme token lists through unchanged", () => {
    expect(normalizeMiraTheme("obsidian company-brand")).toBe(
      "obsidian company-brand",
    );
    expect(normalizeMiraTheme("  mira custom  ")).toBe("  mira custom  ");
  });

  it("omits absent and whitespace-only themes", () => {
    expect(normalizeMiraTheme(undefined)).toBeUndefined();
    expect(normalizeMiraTheme("")).toBeUndefined();
    expect(normalizeMiraTheme("   ")).toBeUndefined();
  });

  it("keeps color mode independent from palette selection", () => {
    expect(miraColorModeAttribute("inherit")).toBeUndefined();
    expect(miraColorModeAttribute("system")).toBe("system");
    expect(miraColorModeClassName("dark")).toBe("dark theme-dark");
    expect(miraColorModeClassName("light")).toBe("light theme-light");
    expect(miraColorModeClassName("system")).toBeUndefined();
  });
});
