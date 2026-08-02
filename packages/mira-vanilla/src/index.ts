import { mount, unmount } from "svelte";
import Mira, { type MiraProps } from "@lapismd/mira";
import type { MiraMode } from "@lapismd/mira/extensions";
import MiraEditor, {
  type MiraEditorHandle,
  type MiraEditorProps,
} from "@lapismd/mira-editor";

export type MiraInstance = {
  update: (props: Partial<MiraProps>) => void;
  destroy: () => void;
};

export function createMira(
  target: HTMLElement,
  props: MiraProps,
): MiraInstance {
  let currentProps = { ...props };
  let component = mount(Mira, {
    target,
    props: currentProps,
  });

  return {
    update(nextProps) {
      currentProps = {
        ...currentProps,
        ...nextProps,
      };
      unmount(component);
      component = mount(Mira, {
        target,
        props: currentProps,
      });
    },
    destroy() {
      unmount(component);
    },
  };
}

export type MiraEditorOptions = Omit<MiraEditorProps, "class"> & {
  root: HTMLElement;
  class?: string;
};

export type MiraEditorEventMap = {
  change: string;
  modeChange: MiraMode;
  readonlyChange: boolean;
};

export type MiraEditorEventName = keyof MiraEditorEventMap;

export type MiraEditorEventHandler<EventName extends MiraEditorEventName> = (
  payload: MiraEditorEventMap[EventName],
) => void;

export type MiraEditorInstance = MiraEditorHandle & {
  destroy: () => void;
  on: <EventName extends MiraEditorEventName>(
    event: EventName,
    handler: MiraEditorEventHandler<EventName>,
  ) => () => void;
  update: (props: Partial<Omit<MiraEditorOptions, "root">>) => void;
};

export function createMiraEditor(
  options: MiraEditorOptions,
): MiraEditorInstance {
  const { root, ...initialProps } = options;
  let currentProps = { ...initialProps };
  let currentValue = initialProps.value ?? "";
  let currentMode =
    initialProps.mode ?? initialProps.defaultEditMode ?? "live-preview";
  let currentReadonly = initialProps.readonly ?? false;
  const listeners: {
    [EventName in MiraEditorEventName]: Set<MiraEditorEventHandler<EventName>>;
  } = {
    change: new Set(),
    modeChange: new Set(),
    readonlyChange: new Set(),
  };

  let component = mountComponent();

  function mountComponent(): MiraEditorHandle {
    return mount(MiraEditor, {
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
    }) as unknown as MiraEditorHandle;
  }

  function emit<EventName extends MiraEditorEventName>(
    event: EventName,
    payload: MiraEditorEventMap[EventName],
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
    executeCommand(commandId) {
      return component.executeCommand(commandId);
    },
    focus() {
      component.focus();
    },
    getCommands() {
      return component.getCommands();
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
    insertMarkdown(markdown, selection) {
      component.insertMarkdown(markdown, selection);
    },
    insertImage() {
      component.insertImage();
    },
    isCommandEnabled(commandId) {
      return component.isCommandEnabled(commandId);
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
      currentProps = { ...currentProps, ...props };
      if (props.value !== undefined) currentValue = props.value;
      if (props.mode !== undefined) currentMode = props.mode;
      if (props.readonly !== undefined) currentReadonly = props.readonly;
      remount();
    },
  };
}

export type { MiraEditorHandle, MiraEditorProps, MiraProps };
export default createMira;
