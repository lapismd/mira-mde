import Mira from "./mira.svelte";

export { Mira };
export type {
  MiraFrontmatterConfig,
  MiraHandle,
  MiraProps,
  MiraOutlineVariant,
} from "./types";
export type { MiraMarkdownActionId } from "./core";
export {
  miraBlockToolbarItemIds,
  type MiraBlockControlsOptions,
  type MiraBlockToolbarConfig,
  type MiraBlockToolbarItemId,
  type MiraToolbarPlacement,
} from "./extensions";
export default Mira;
