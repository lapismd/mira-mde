import { describe, expect, it } from "vitest";
import {
  miraColorModeAttribute,
  miraColorModeClassName,
  normalizeMiraTheme,
  resolveMiraColorModeAttribute,
  resolveMiraThemeAttribute,
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

  it("resolves an omitted appearance from the nearest themed host", () => {
    const host = document.createElement("div");
    const trigger = document.createElement("button");
    host.dataset.miraTheme = "obsidian company-brand";
    host.dataset.miraColorMode = "dark";
    host.append(trigger);

    expect(resolveMiraThemeAttribute(undefined, trigger)).toBe(
      "obsidian company-brand",
    );
    expect(resolveMiraColorModeAttribute("inherit", trigger)).toBe("dark");
    expect(resolveMiraThemeAttribute("mira", trigger)).toBe("mira");
    expect(resolveMiraColorModeAttribute("light", trigger)).toBe("light");
  });
});
