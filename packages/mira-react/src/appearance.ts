import type { MiraColorMode } from "@lapismd/mira/extensions";

export function normalizeMiraTheme(
  theme: string | undefined,
): string | undefined {
  return theme?.trim() ? theme : undefined;
}

export function miraColorModeAttribute(
  colorMode: MiraColorMode,
): Exclude<MiraColorMode, "inherit"> | undefined {
  return colorMode === "inherit" ? undefined : colorMode;
}

export function miraColorModeClassName(
  colorMode: MiraColorMode,
): string | undefined {
  if (colorMode === "dark") return "dark theme-dark";
  if (colorMode === "light") return "light theme-light";
  return undefined;
}
