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

export function resolveMiraThemeAttribute(
  theme: string | null | undefined,
  source?: Element | null,
): string | undefined {
  return (
    normalizeMiraTheme(theme) ??
    normalizeMiraTheme(
      source
        ?.closest<HTMLElement>("[data-mira-theme]")
        ?.getAttribute("data-mira-theme"),
    )
  );
}

export function miraColorModeAttribute(
  colorMode: MiraColorMode | undefined,
): Exclude<MiraColorMode, "inherit"> | undefined {
  return colorMode && colorMode !== "inherit" ? colorMode : undefined;
}

export function resolveMiraColorModeAttribute(
  colorMode: MiraColorMode | undefined,
  source?: Element | null,
): Exclude<MiraColorMode, "inherit"> | undefined {
  const explicit = miraColorModeAttribute(colorMode);
  if (explicit) return explicit;

  const inherited = source
    ?.closest<HTMLElement>("[data-mira-color-mode]")
    ?.getAttribute("data-mira-color-mode");
  return inherited === "system" || inherited === "dark" || inherited === "light"
    ? inherited
    : undefined;
}

export function miraColorModeClassName(
  colorMode: MiraColorMode | undefined,
): string | undefined {
  if (colorMode === "dark") return "dark theme-dark";
  if (colorMode === "light") return "light theme-light";
  return undefined;
}
