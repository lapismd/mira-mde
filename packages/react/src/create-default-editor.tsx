import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { MiraDefaultMde } from "./default-mde";
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
  const reactRoot = createRoot(root);
  let currentProps = { ...initialProps };
  let currentValue = initialProps.value ?? initialProps.defaultValue ?? "";
  let currentMode =
    initialProps.mode ??
    initialProps.defaultMode ??
    initialProps.defaultEditMode ??
    "live-preview";
  let currentReadonly =
    initialProps.readonly ?? initialProps.defaultReadonly ?? false;
  let handle: MiraDefaultMdeHandle | null = null;
  const listeners: {
    [EventName in MiraDefaultEditorEventName]: Set<
      MiraDefaultEditorEventHandler<EventName>
    >;
  } = {
    change: new Set(),
    modeChange: new Set(),
    readonlyChange: new Set(),
  };

  function emit<EventName extends MiraDefaultEditorEventName>(
    event: EventName,
    payload: MiraDefaultEditorEventMap[EventName],
  ): void {
    for (const listener of listeners[event]) {
      listener(payload as never);
    }
  }

  function render(): void {
    flushSync(() => {
      reactRoot.render(
        <MiraDefaultMde
          {...currentProps}
          mode={currentMode}
          onChange={(value) => {
            currentValue = value;
            currentProps.onChange?.(value);
            emit("change", value);
          }}
          onModeChange={(mode) => {
            currentMode = mode;
            currentProps.onModeChange?.(mode);
            emit("modeChange", mode);
          }}
          onReadonlyChange={(readonly) => {
            currentReadonly = readonly;
            currentProps.onReadonlyChange?.(readonly);
            emit("readonlyChange", readonly);
          }}
          readonly={currentReadonly}
          ref={(nextHandle) => {
            handle = nextHandle;
          }}
          value={currentValue}
        />,
      );
    });
  }

  render();

  return {
    destroy() {
      reactRoot.unmount();
      handle = null;
    },
    focus() {
      handle?.focus();
    },
    getMarkdown() {
      return handle?.getMarkdown() ?? currentValue;
    },
    getMode() {
      return handle?.getMode() ?? currentMode;
    },
    getSelection() {
      return handle?.getSelection() ?? null;
    },
    insertMarkdown(markdown) {
      handle?.insertMarkdown(markdown);
    },
    insertImage() {
      handle?.insertImage();
    },
    on(event, handler) {
      listeners[event].add(handler as never);
      return () => {
        listeners[event].delete(handler as never);
      };
    },
    setMarkdown(markdown) {
      currentValue = markdown;
      handle?.setMarkdown(markdown);
      render();
    },
    setMode(mode) {
      currentMode = mode;
      handle?.setMode(mode);
      render();
    },
    setReadonly(readonly) {
      currentReadonly = readonly;
      handle?.setReadonly(readonly);
      render();
    },
    setSelection(selection) {
      handle?.setSelection(selection);
    },
    update(props) {
      currentProps = {
        ...currentProps,
        ...props,
      };
      if (props.value !== undefined) {
        currentValue = props.value;
      }
      if (props.defaultValue !== undefined && currentValue === "") {
        currentValue = props.defaultValue;
      }
      if (props.mode !== undefined) {
        currentMode = props.mode;
      }
      if (props.readonly !== undefined) {
        currentReadonly = props.readonly;
      }
      render();
    },
  };
}
