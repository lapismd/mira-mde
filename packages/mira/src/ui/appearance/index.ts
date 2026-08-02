import { getContext, setContext } from "svelte";
import {
  miraAppearanceContextKey,
  miraColorModeAttribute,
  miraColorModeClassName,
  normalizeMiraTheme,
  type MiraAppearanceContext,
} from "../../internal/appearance-context.js";

export type { MiraAppearanceContext };
export { miraColorModeAttribute, miraColorModeClassName, normalizeMiraTheme };

export function provideMiraAppearance(appearance: MiraAppearanceContext): void {
  setContext(miraAppearanceContextKey, appearance);
}

export function useMiraAppearance(): MiraAppearanceContext | undefined {
  return getContext<MiraAppearanceContext | undefined>(
    miraAppearanceContextKey,
  );
}
