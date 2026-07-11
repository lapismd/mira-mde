import { mount, unmount } from "svelte";
import type { MiraMode } from "@mira-mde/extensions";
import MiraDefaultMde from "./default-mde.svelte";
import MiraDefaultToolbar from "./default-toolbar.svelte";
import {
  createMiraDefaultExtensions,
  defaultMiraEditMode,
  defaultMiraFeatures,
  MiraFeature,
  resolveMiraDefaultEditMode,
  resolveMiraDefaultFeatures,
  resolveMiraDefaultModes,
  resolveMiraDefaultSlashCommands,
  resolveMiraDefaultToolbarActions,
  resolveMiraDefaultToolbarDefinitions,
  resolveMiraDefaultToolbarItems,
} from "./features";
import type {
  MiraDefaultEditor,
  MiraDefaultEditorEventHandler,
  MiraDefaultEditorEventMap,
  MiraDefaultEditorEventName,
  MiraDefaultEditorOptions,
  MiraDefaultMdeHandle,
} from "./types";

export function createMiraDefaultEditor(
  options: MiraDefaultEditorOptions,
): MiraDefaultEditor {
  const { root, ...initialProps } = options;
  let currentProps = { ...initialProps };
  let currentValue = initialProps.value ?? "";
  let currentMode =
    initialProps.mode ?? initialProps.defaultEditMode ?? "live-preview";
  let currentReadonly = initialProps.readonly ?? false;
  const listeners: {
    [EventName in MiraDefaultEditorEventName]: Set<
      MiraDefaultEditorEventHandler<EventName>
    >;
  } = {
    change: new Set(),
    modeChange: new Set(),
    readonlyChange: new Set(),
  };

  let component = mountComponent();

  function mountComponent(): MiraDefaultMdeHandle {
    return mount(MiraDefaultMde, {
      target: root,
      props: {
        ...currentProps,
        value: currentValue,
        mode: currentMode,
        readonly: currentReadonly,
        onChange(value: string) {
          currentValue = value;
          currentProps.onChange?.(value);
          emit("change", value);
        },
        onModeChange(mode: MiraMode) {
          currentMode = mode;
          currentProps.onModeChange?.(mode);
          emit("modeChange", mode);
        },
        onReadonlyChange(readonly: boolean) {
          currentReadonly = readonly;
          currentProps.onReadonlyChange?.(readonly);
          emit("readonlyChange", readonly);
        },
      },
    }) as unknown as MiraDefaultMdeHandle;
  }

  function emit<EventName extends MiraDefaultEditorEventName>(
    event: EventName,
    payload: MiraDefaultEditorEventMap[EventName],
  ): void {
    for (const listener of listeners[event]) {
      listener(payload as never);
    }
  }

  function remount(): void {
    unmount(component as never);
    component = mountComponent();
  }

  return {
    destroy() {
      unmount(component as never);
    },
    focus() {
      component.focus();
    },
    getMarkdown() {
      return component.getMarkdown?.() ?? currentValue;
    },
    getMode() {
      return component.getMode?.() ?? currentMode;
    },
    getSelection() {
      return component.getSelection?.() ?? null;
    },
    insertMarkdown(markdown) {
      component.insertMarkdown(markdown);
    },
    insertImage() {
      component.insertImage();
    },
    on(event, handler) {
      listeners[event].add(handler as never);
      return () => {
        listeners[event].delete(handler as never);
      };
    },
    setMarkdown(markdown) {
      currentValue = markdown;
      component.setMarkdown(markdown);
    },
    setMode(mode) {
      component.setMode(mode);
      currentMode = component.getMode();
    },
    setReadonly(readonly) {
      currentReadonly = readonly;
      component.setReadonly(readonly);
    },
    setSelection(selection) {
      component.setSelection(selection);
    },
    update(props) {
      currentProps = {
        ...currentProps,
        ...props,
      };
      if (props.value !== undefined) {
        currentValue = props.value;
      }
      if (props.mode !== undefined) {
        currentMode = props.mode;
      }
      if (props.readonly !== undefined) {
        currentReadonly = props.readonly;
      }
      remount();
    },
  };
}

export {
  createMiraDefaultExtensions,
  defaultMiraEditMode,
  defaultMiraFeatures,
  MiraDefaultMde,
  MiraDefaultToolbar,
  MiraFeature,
  resolveMiraDefaultEditMode,
  resolveMiraDefaultFeatures,
  resolveMiraDefaultModes,
  resolveMiraDefaultSlashCommands,
  resolveMiraDefaultToolbarActions,
  resolveMiraDefaultToolbarDefinitions,
  resolveMiraDefaultToolbarItems,
};
export {
  isMiraEditMode,
  miraDefaultModeLabels,
  miraDefaultToolbarItemLabels,
  miraViewOptionsLabel,
  miraViewToggleLabel,
  resolveMiraAlternateEditMode,
  resolveMiraModeAfterSplit,
  resolveMiraViewModeMenuItems,
  resolveMiraViewToggleMode,
  templateForMiraToolbarItem,
} from "./toolbar-model";
export type {
  MiraDefaultEditor,
  MiraDefaultEditorEventHandler,
  MiraDefaultEditorEventMap,
  MiraDefaultEditorEventName,
  MiraDefaultEditorOptions,
  MiraDefaultEditMode,
  MiraDefaultMdeHandle,
  MiraDefaultMdeProps,
  MiraDefaultToolbarProps,
  MiraFrontmatterConfig,
} from "./types";
export type {
  MiraDefaultBlockControlsConfig,
  MiraDefaultFeatureConfigs,
  MiraDefaultMermaidConfig,
  MiraDefaultSlashCommandConfig,
  MiraDefaultSlashCommandId,
  MiraDefaultToolbarAction,
  MiraDefaultToolbarActionContext,
  MiraDefaultToolbarButtonAction,
  MiraDefaultToolbarConfig,
  MiraDefaultToolbarDefinition,
  MiraDefaultToolbarDropdownAction,
  MiraDefaultToolbarItem,
  MiraDefaultToolbarMenuAction,
  MiraDefaultToolbarMenuItem,
  MiraDefaultToolbarMenuLabel,
  MiraDefaultToolbarMenuSeparator,
  MiraFeatureFlags,
  MiraFeatureName,
  ResolvedMiraDefaultFeatures,
} from "./features";
export type { MiraViewModeMenuItem } from "./toolbar-model";
export default createMiraDefaultEditor;
