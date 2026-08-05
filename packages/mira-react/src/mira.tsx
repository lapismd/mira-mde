import type { Extension } from "@codemirror/state";
import {
  createMiraCodeMirrorExtensions,
  createMiraEditorController,
  openImageFilePicker,
  type MiraEditorController,
  type MiraMarkdownActionId,
} from "@lapismd/mira/core";
import {
  executeMiraCommand,
  isMiraCommandEnabled,
  mountMiraExtensionStyles,
  resolveMiraExtensions,
  type MiraCommand,
  type MiraExtensionRuntimeContext,
  type MiraMode,
  type MiraTemplateSelection,
} from "@lapismd/mira/extensions";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLatestRef, cx } from "./hooks";
import {
  miraColorModeAttribute,
  miraColorModeClassName,
  normalizeMiraTheme,
} from "./appearance";
import { MarkdownPreviewHost } from "./preview-host";
import type { MiraHandle, MiraProps } from "./types";

const defaultMode: MiraMode = "live-preview";

export const Mira = forwardRef<MiraHandle, MiraProps>(function Mira(
  {
    assetResolver,
    authoring,
    className,
    defaultMode: defaultModeProp = defaultMode,
    defaultReadonly = false,
    defaultValue = "",
    extensions = [],
    fileAdapter,
    imageConfig,
    frontmatterOpen = true,
    frontmatterConfig,
    headingIds = false,
    headingIdPrefix = "",
    htmlPolicy = "trusted",
    emoji = false,
    outline = false,
    outlineVariant = "floating",
    blockControls = false,
    indentGuides = true,
    indentWithTabs = true,
    indentWidth = 4,
    lineWrapping = true,
    linkResolver,
    mode: modeProp,
    onChange,
    onFrontmatterChange,
    onModeChange,
    onReadonlyChange,
    placeholder = "Start writing Markdown...",
    readonly: readonlyProp,
    sourcePath,
    spellcheck = true,
    theme,
    colorMode = "inherit",
    toolbar = true,
    value: valueProp,
  },
  ref,
) {
  const editorHostRef = useRef<HTMLDivElement | null>(null);
  const previewPaneRef = useRef<HTMLElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<MiraEditorController | null>(null);
  const cleanupExtensionMountsRef = useRef<Array<() => void>>([]);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [uncontrolledMode, setUncontrolledMode] = useState(defaultModeProp);
  const [uncontrolledReadonly, setUncontrolledReadonly] =
    useState(defaultReadonly);
  const value = valueProp ?? uncontrolledValue;
  const mode = modeProp ?? uncontrolledMode;
  const readonly = readonlyProp ?? uncontrolledReadonly;
  const valueRef = useLatestRef(value);
  const modeRef = useLatestRef(mode);
  const readonlyRef = useLatestRef(readonly);
  const onChangeRef = useLatestRef(onChange);
  const onModeChangeRef = useLatestRef(onModeChange);
  const onReadonlyChangeRef = useLatestRef(onReadonlyChange);
  const onFrontmatterChangeRef = useLatestRef(onFrontmatterChange);

  const resolvedExtensions = useMemo(
    () =>
      resolveMiraExtensions(extensions, {
        mode,
        readonly,
        sourcePath,
      }),
    [extensions, mode, readonly, sourcePath],
  );

  const commitValue = useCallback(
    (nextValue: string) => {
      if (valueProp === undefined) {
        setUncontrolledValue(nextValue);
      }
      onChangeRef.current?.(nextValue);
    },
    [onChangeRef, valueProp],
  );

  const setMode = useCallback(
    (nextMode: MiraMode) => {
      if (modeProp === undefined) {
        setUncontrolledMode(nextMode);
      }
      onModeChangeRef.current?.(nextMode);
    },
    [modeProp, onModeChangeRef],
  );

  const setReadonly = useCallback(
    (nextReadonly: boolean) => {
      if (readonlyProp === undefined) {
        setUncontrolledReadonly(nextReadonly);
      }
      onReadonlyChangeRef.current?.(nextReadonly);
    },
    [onReadonlyChangeRef, readonlyProp],
  );

  const handleInsertMarkdown = useCallback(
    (markdown: string, selection?: MiraTemplateSelection) => {
      const controller = controllerRef.current;
      controller?.replaceSelection(markdown, selection);
      controller?.focus();
    },
    [],
  );

  const handleInsertImage = useCallback(() => {
    const controller = controllerRef.current;
    if (controller) {
      openImageFilePicker(controller.view, imageConfig);
    }
  }, [imageConfig]);

  const handleApplyMarkdownAction = useCallback(
    (action: MiraMarkdownActionId): boolean => {
      if (readonlyRef.current || modeRef.current === "preview") {
        return false;
      }
      return controllerRef.current?.applyMarkdownAction(action) ?? false;
    },
    [modeRef, readonlyRef],
  );

  const createExtensionRuntimeContext = useCallback(
    (
      activeController: MiraEditorController | null = controllerRef.current,
      view: unknown = activeController?.view,
    ): MiraExtensionRuntimeContext => ({
      view,
      mode: modeRef.current,
      readonly: readonlyRef.current,
      sourcePath,
      focus: () => activeController?.focus(),
      getValue: () => activeController?.getValue() ?? valueRef.current,
      insertImage: handleInsertImage,
      insertMarkdown: handleInsertMarkdown,
      setValue(nextValue) {
        if (valueProp === undefined) {
          setUncontrolledValue(nextValue);
        }
        activeController?.setValue(nextValue);
      },
    }),
    [
      handleInsertImage,
      handleInsertMarkdown,
      modeRef,
      readonlyRef,
      sourcePath,
      valueProp,
      valueRef,
    ],
  );

  const buildCodeMirrorExtensions = useCallback((): Extension[] => {
    return createMiraCodeMirrorExtensions({
      mode: modeRef.current,
      readonly: readonlyRef.current,
      placeholder,
      lineWrapping,
      spellcheck,
      blockControls,
      indentGuides,
      indentWithTabs,
      indentWidth,
      extensions,
      sourcePath,
      linkResolver,
      assetResolver,
      fileAdapter,
      imageConfig,
      authoring,
      frontmatterOpen,
      frontmatterConfig,
      runtimeContext: (view) =>
        createExtensionRuntimeContext(controllerRef.current, view),
      onChange(replacement, from, to, nextValue) {
        const controller = controllerRef.current;
        if (controller) {
          controller.view.dispatch({
            changes: { from, insert: replacement, to },
          });
        } else {
          commitValue(nextValue);
        }
      },
      onFrontmatterChange: (...args) =>
        onFrontmatterChangeRef.current?.(...args),
    });
  }, [
    assetResolver,
    authoring,
    blockControls,
    commitValue,
    createExtensionRuntimeContext,
    extensions,
    fileAdapter,
    frontmatterOpen,
    frontmatterConfig,
    indentGuides,
    indentWithTabs,
    indentWidth,
    imageConfig,
    lineWrapping,
    linkResolver,
    modeRef,
    onFrontmatterChangeRef,
    placeholder,
    readonlyRef,
    sourcePath,
    spellcheck,
  ]);

  const runExtensionMounts = useCallback(
    (activeController: MiraEditorController) => {
      for (const cleanup of cleanupExtensionMountsRef.current) {
        cleanup();
      }
      cleanupExtensionMountsRef.current = [];

      for (const mountExtension of resolvedExtensions.onMount) {
        const cleanup = mountExtension(
          createExtensionRuntimeContext(
            activeController,
            activeController.view,
          ),
        );
        if (typeof cleanup === "function") {
          cleanupExtensionMountsRef.current.push(cleanup);
        }
      }
    },
    [createExtensionRuntimeContext, resolvedExtensions.onMount],
  );

  const findCommand = useCallback(
    (commandId: string): MiraCommand | undefined => {
      for (
        let index = resolvedExtensions.commands.length - 1;
        index >= 0;
        index -= 1
      ) {
        const command = resolvedExtensions.commands[index];
        if (command?.id === commandId) {
          return command;
        }
      }
      return undefined;
    },
    [resolvedExtensions.commands],
  );

  const isCommandEnabled = useCallback(
    (commandId: string): boolean => {
      const command = findCommand(commandId);
      return Boolean(
        command &&
        isMiraCommandEnabled(command, createExtensionRuntimeContext()),
      );
    },
    [createExtensionRuntimeContext, findCommand],
  );

  const executeCommand = useCallback(
    (commandId: string): boolean =>
      executeMiraCommand(
        resolvedExtensions.commands,
        commandId,
        createExtensionRuntimeContext(),
      ),
    [createExtensionRuntimeContext, resolvedExtensions.commands],
  );

  useEffect(() => {
    if (!editorHostRef.current) {
      return;
    }

    const activeController = createMiraEditorController({
      codeMirrorExtensions: buildCodeMirrorExtensions(),
      onChange(nextValue) {
        commitValue(nextValue);
      },
      value,
    });

    activeController.mount(editorHostRef.current);
    controllerRef.current = activeController;
    runExtensionMounts(activeController);

    return () => {
      for (const cleanup of cleanupExtensionMountsRef.current) {
        cleanup();
      }
      cleanupExtensionMountsRef.current = [];
      activeController.destroy();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const controller = controllerRef.current;
    if (controller && value !== controller.getValue()) {
      controller.setValue(value);
    }
  }, [value]);

  useEffect(
    () => mountMiraExtensionStyles(resolvedExtensions.styles),
    [resolvedExtensions.styles],
  );

  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) {
      return;
    }
    controller.update({
      codeMirrorExtensions: buildCodeMirrorExtensions(),
    });
    runExtensionMounts(controller);
  }, [buildCodeMirrorExtensions, runExtensionMounts]);

  const handlePreviewChange = useCallback(
    (replacement: string, from: number, to: number) => {
      const currentValue = valueRef.current;
      const nextValue = `${currentValue.slice(0, from)}${replacement}${currentValue.slice(to)}`;
      commitValue(nextValue);
    },
    [commitValue, valueRef],
  );

  useImperativeHandle(
    ref,
    () => ({
      applyMarkdownAction: handleApplyMarkdownAction,
      executeCommand,
      focus() {
        controllerRef.current?.focus();
      },
      getMarkdown() {
        return controllerRef.current?.getValue() ?? valueRef.current;
      },
      getCommands() {
        return resolvedExtensions.commands;
      },
      getMode() {
        return modeRef.current;
      },
      getSelection() {
        return controllerRef.current?.getSelection() ?? null;
      },
      insertMarkdown: handleInsertMarkdown,
      insertImage: handleInsertImage,
      isCommandEnabled,
      setMarkdown(markdown) {
        if (valueProp === undefined) {
          setUncontrolledValue(markdown);
        }
        controllerRef.current?.setValue(markdown);
      },
      setMode,
      setReadonly,
      setSelection(selection) {
        controllerRef.current?.setSelection(selection);
      },
    }),
    [
      handleInsertImage,
      handleApplyMarkdownAction,
      handleInsertMarkdown,
      executeCommand,
      isCommandEnabled,
      modeRef,
      resolvedExtensions.commands,
      setMode,
      setReadonly,
      valueProp,
      valueRef,
    ],
  );

  const showEditor = mode !== "preview";
  const showPreview = mode === "preview" || mode === "split";
  const themeAttribute = normalizeMiraTheme(theme);
  const colorModeAttribute = miraColorModeAttribute(colorMode);
  const colorModeClass = miraColorModeClassName(colorMode);

  useEffect(() => {
    const controller = controllerRef.current;
    const previewPane = previewPaneRef.current;
    if (mode !== "split" || !controller || !previewPane) {
      return;
    }

    return syncSplitScroll(controller.view.scrollDOM, previewPane);
  }, [mode, showPreview]);

  return (
    <div
      className={cx("mira", colorModeClass, className)}
      data-mira-theme={themeAttribute}
      data-mira-color-mode={colorModeAttribute}
      data-mode={mode}
      data-readonly={readonly}
      ref={rootRef}
    >
      {toolbar ? (
        <div className="mira__toolbar" aria-label="Markdown editor toolbar">
          <div className="mira-toggle-group" aria-label="Editor mode">
            {(["source", "live-preview", "preview", "split"] as MiraMode[]).map(
              (modeOption) => (
                <button
                  className="mira-toggle-group__item"
                  data-state={mode === modeOption ? "on" : "off"}
                  key={modeOption}
                  onClick={() => setMode(modeOption)}
                  type="button"
                >
                  {modeOption === "live-preview" ? "Live" : modeOption}
                </button>
              ),
            )}
          </div>
          <div className="mira-separator--vertical mira__toolbar-separator" />
          <div className="mira__actions">
            <button
              className="mira-ui-button mira-ui-button--ghost mira-ui-button--sm"
              aria-label="Bold"
              disabled={readonly || mode === "preview"}
              onClick={() => handleApplyMarkdownAction("bold")}
              type="button"
            >
              B
            </button>
            <button
              className="mira-ui-button mira-ui-button--ghost mira-ui-button--sm"
              aria-label="Italic"
              disabled={readonly || mode === "preview"}
              onClick={() => handleApplyMarkdownAction("italic")}
              type="button"
            >
              I
            </button>
            <button
              className="mira-ui-button mira-ui-button--ghost mira-ui-button--sm"
              aria-label="Link"
              disabled={readonly || mode === "preview"}
              onClick={() => handleApplyMarkdownAction("link")}
              type="button"
            >
              Link
            </button>
            <button
              className="mira-ui-button mira-ui-button--ghost mira-ui-button--sm"
              disabled={readonly || mode === "preview"}
              onClick={handleInsertImage}
              type="button"
            >
              Image
            </button>
          </div>
        </div>
      ) : null}

      <div className="mira__body">
        <section
          aria-hidden={showEditor ? "false" : "true"}
          className={cx(
            "mira__pane mira__pane--editor markdown-editor-surface",
            mode === "source"
              ? "markdown-view__editor--source markdown-source-mode"
              : "markdown-view__editor--live-preview markdown-live-preview-mode",
          )}
          data-visible={showEditor}
        >
          <div className="mira__editor-host" ref={editorHostRef} />
        </section>

        {showPreview ? (
          <section
            className={cx(
              "mira__pane mira__pane--preview",
              outline && outlineVariant === "floating"
                ? "mira__pane--outline-floating"
                : undefined,
            )}
            ref={previewPaneRef}
          >
            <MarkdownPreviewHost
              assetResolver={assetResolver}
              extensions={extensions}
              fileAdapter={fileAdapter}
              frontmatterConfig={frontmatterConfig}
              frontmatterOpen={frontmatterOpen}
              headingIds={headingIds || outline}
              headingIdPrefix={headingIdPrefix}
              htmlPolicy={htmlPolicy}
              emoji={emoji}
              outline={outline}
              outlineVariant={outlineVariant}
              linkResolver={linkResolver}
              onChange={handlePreviewChange}
              onFrontmatterChange={onFrontmatterChange}
              sourcePath={sourcePath}
              value={value}
            />
          </section>
        ) : null}
      </div>
    </div>
  );
});

Mira.displayName = "Mira";

function syncSplitScroll(
  editorScroller: HTMLElement,
  previewPane: HTMLElement,
): () => void {
  const previewScroller =
    previewPane.querySelector<HTMLElement>(".mira-markdown-preview") ??
    previewPane;
  let activeSource: HTMLElement | null = null;
  let releaseFrame = 0;

  const sync = (source: HTMLElement, target: HTMLElement) => {
    if (activeSource && activeSource !== source) {
      return;
    }

    const sourceMax = source.scrollHeight - source.clientHeight;
    const targetMax = target.scrollHeight - target.clientHeight;
    if (sourceMax <= 0 || targetMax <= 0) {
      return;
    }

    activeSource = source;
    target.scrollTop = (source.scrollTop / sourceMax) * targetMax;
    cancelAnimationFrame(releaseFrame);
    releaseFrame = requestAnimationFrame(() => {
      activeSource = null;
    });
  };

  const syncPreview = () => sync(editorScroller, previewScroller);
  const syncEditor = () => sync(previewScroller, editorScroller);

  editorScroller.addEventListener("scroll", syncPreview, { passive: true });
  previewScroller.addEventListener("scroll", syncEditor, { passive: true });

  return () => {
    cancelAnimationFrame(releaseFrame);
    editorScroller.removeEventListener("scroll", syncPreview);
    previewScroller.removeEventListener("scroll", syncEditor);
  };
}
