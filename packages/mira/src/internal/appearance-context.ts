import type { MiraColorMode } from "../extensions/index.js";

export type MiraAppearanceContext = {
  readonly theme: string | undefined;
  readonly colorMode: MiraColorMode;
};

export const miraAppearanceContextKey = Symbol("mira-appearance-context");

export function normalizeMiraTheme(
  theme: string | null | undefined,
): string | undefined {
  return theme?.trim() ? theme : undefined;
}

export function miraColorModeAttribute(
  colorMode: MiraColorMode | undefined,
): Exclude<MiraColorMode, "inherit"> | undefined {
  return colorMode && colorMode !== "inherit" ? colorMode : undefined;
}

export function miraColorModeClassName(
  colorMode: MiraColorMode | undefined,
): string | undefined {
  if (colorMode === "dark") return "dark theme-dark";
  if (colorMode === "light") return "light theme-light";
  return undefined;
}
