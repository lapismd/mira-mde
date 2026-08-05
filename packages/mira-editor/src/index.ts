import MiraEditor from "./mira-editor.svelte";
import MiraEditorToolbar from "./mira-editor-toolbar.svelte";
import {
  createMiraEditorExtensions,
  defaultMiraEditorEditMode,
  defaultMiraEditorFeatures,
  MiraFeature,
  resolveMiraEditorEditMode,
  resolveMiraEditorFeatures,
  resolveMiraEditorModes,
  resolveMiraEditorSlashCommands,
  resolveMiraEditorToolbarActions,
  resolveMiraEditorToolbarDefinitions,
  resolveMiraEditorToolbarItems,
} from "./features";
export {
  createMiraEditorExtensions,
  defaultMiraEditorEditMode,
  defaultMiraEditorFeatures,
  MiraEditor,
  MiraEditorToolbar,
  MiraFeature,
  resolveMiraEditorEditMode,
  resolveMiraEditorFeatures,
  resolveMiraEditorModes,
  resolveMiraEditorSlashCommands,
  resolveMiraEditorToolbarActions,
  resolveMiraEditorToolbarDefinitions,
  resolveMiraEditorToolbarItems,
};
export {
  isMiraEditMode,
  miraEditorModeLabels,
  miraEditorToolbarItemLabels,
  miraViewOptionsLabel,
  miraViewToggleLabel,
  resolveMiraAlternateEditMode,
  resolveMiraModeAfterSplit,
  resolveMiraViewModeMenuItems,
  resolveMiraViewToggleMode,
  templateForMiraToolbarItem,
} from "./toolbar-model";
export type {
  MiraEditorEditMode,
  MiraEditorHandle,
  MiraEditorProps,
  MiraOutlineVariant,
  MiraEditorToolbarProps,
  MiraFrontmatterConfig,
} from "./types";
export type {
  MiraEditorBlockControlsConfig,
  MiraEditorFeatureConfigs,
  MiraEditorMermaidConfig,
  MiraEditorSlashCommandConfig,
  MiraEditorSlashCommandId,
  MiraEditorToolbarAction,
  MiraEditorToolbarActionContext,
  MiraEditorToolbarButtonAction,
  MiraEditorToolbarConfig,
  MiraEditorToolbarDefinition,
  MiraEditorToolbarDropdownAction,
  MiraEditorToolbarItem,
  MiraEditorToolbarMenuAction,
  MiraEditorToolbarMenuItem,
  MiraEditorToolbarMenuLabel,
  MiraEditorToolbarMenuSeparator,
  MiraFeatureFlags,
  MiraFeatureName,
  ResolvedMiraEditorFeatures,
} from "./features";
export type { MiraViewModeMenuItem } from "./toolbar-model";
export { MIRA_EDITOR_VERSION } from "./version";
export default MiraEditor;
