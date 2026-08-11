import Mira from "./mira.svelte";
import MiraCodeEditor from "./mira-code-editor.svelte";

export { Mira, MiraCodeEditor };
export type {
  MiraCodeEditorHandle,
  MiraCodeEditorHeight,
  MiraCodeEditorProps,
  MiraCodeEditorSurface,
  MiraCodeEditorVariant,
} from "./mira-code-editor";
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
