import type { Extension } from "@codemirror/state";
import {
  createBaseCodeMirrorExtensions,
  createSlashCommandExtensions,
} from "@mira-mde/codemirror";
import { createMarkdownCodeMirrorExtensions } from "@mira-mde/codemirror-markdown";
import { createRichEditorExtensions } from "@mira-mde/codemirror-rich";
import { createTableExtensions } from "@mira-mde/codemirror-tables";
import {
  createImageDropPasteExtension,
  createMiraEditorController,
  openImageFilePicker,
  type MiraEditorController,
} from "@mira-mde/core";
import {
  resolveMiraExtensions,
  type MiraMode,
  type MiraTheme,
  type MiraThemeConfig,
} from "@mira-mde/extensions";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useLatestRef, cx } from "./hooks";
import { MarkdownPreviewHost } from "./preview-host";
import type { MiraMdeHandle, MiraMdeProps } from "./types";

const defaultMode: MiraMode = "live-preview";

export const MiraMde = forwardRef<MiraMdeHandle, MiraMdeProps>(function MiraMde(
  {
    assetResolver,
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
    theme = "obsidian",
    themeConfig,
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

  const handleInsertMarkdown = useCallback((markdown: string) => {
    const controller = controllerRef.current;
    controller?.replaceSelection(markdown);
    controller?.focus();
  }, []);

  const handleInsertImage = useCallback(() => {
    const controller = controllerRef.current;
    if (controller) {
      openImageFilePicker(controller.view, imageConfig);
    }
  }, [imageConfig]);

  const buildCodeMirrorExtensions = useCallback((): Extension[] => {
    const resolved = resolveMiraExtensions(extensions, {
      mode: modeRef.current,
      readonly: readonlyRef.current,
      sourcePath,
    });

    return [
      createBaseCodeMirrorExtensions({
        indentWithTabs,
        indentWidth,
        lineWrapping,
        placeholder,
        readonly: readonlyRef.current,
        spellcheck,
      }),
      createSlashCommandExtensions({
        commands: resolved.slashCommands,
      }),
      createMarkdownCodeMirrorExtensions({
        codeLanguages: resolved.codeLanguages,
        sourceMode: modeRef.current === "source",
      }),
      createTableExtensions(),
      createImageDropPasteExtension(imageConfig),
      createRichEditorExtensions({
        assetResolver,
        blockActions: resolved.blockActions,
        blockControls:
          blockControls &&
          modeRef.current !== "preview" &&
          !readonlyRef.current,
        extensions,
        fileAdapter,
        frontmatterConfig,
        frontmatterOpen,
        indentGuides,
        linkResolver,
        livePreview: modeRef.current === "live-preview",
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
        sourcePath,
      } as Parameters<typeof createRichEditorExtensions>[0] & {
        frontmatterConfig?: unknown;
        fileAdapter?: unknown;
      }),
      resolved.codeMirror,
    ].flat();
  }, [
    assetResolver,
    blockControls,
    commitValue,
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
        const cleanup = mountExtension({
          focus: () => activeController.focus(),
          getValue: () => activeController.getValue(),
          insertMarkdown: handleInsertMarkdown,
          insertImage: handleInsertImage,
          setValue: (nextValue) => activeController.setValue(nextValue),
          view: activeController.view,
        });
        if (typeof cleanup === "function") {
          cleanupExtensionMountsRef.current.push(cleanup);
        }
      }
    },
    [handleInsertImage, handleInsertMarkdown, resolvedExtensions.onMount],
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
      focus() {
        controllerRef.current?.focus();
      },
      getMarkdown() {
        return controllerRef.current?.getValue() ?? valueRef.current;
      },
      getMode() {
        return modeRef.current;
      },
      getSelection() {
        return controllerRef.current?.getSelection() ?? null;
      },
      insertMarkdown: handleInsertMarkdown,
      insertImage: handleInsertImage,
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
      handleInsertMarkdown,
      modeRef,
      setMode,
      setReadonly,
      valueProp,
      valueRef,
    ],
  );

  const showEditor = mode !== "preview";
  const showPreview = mode === "preview" || mode === "split";
  const inheritedTheme = useInheritedTheme(theme, themeConfig, rootRef);
  const themeClass = themeClassName(
    theme === "inherit" ? inheritedTheme : theme,
  );

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
      className={cx("mira-mde", themeClass, className)}
      data-mode={mode}
      data-readonly={readonly}
      ref={rootRef}
    >
      {toolbar ? (
        <div className="mira-mde__toolbar" aria-label="Markdown editor toolbar">
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
          <div className="mira-separator--vertical mira-mde__toolbar-separator" />
          <div className="mira-mde__actions">
            <button
              className="mira-ui-button mira-ui-button--ghost mira-ui-button--sm"
              onClick={() => handleInsertMarkdown("**strong**")}
              type="button"
            >
              B
            </button>
            <button
              className="mira-ui-button mira-ui-button--ghost mira-ui-button--sm"
              onClick={() => handleInsertMarkdown("_emphasis_")}
              type="button"
            >
              I
            </button>
            <button
              className="mira-ui-button mira-ui-button--ghost mira-ui-button--sm"
              onClick={() =>
                handleInsertMarkdown("[label](https://example.com)")
              }
              type="button"
            >
              Link
            </button>
            <button
              className="mira-ui-button mira-ui-button--ghost mira-ui-button--sm"
              onClick={handleInsertImage}
              type="button"
            >
              Image
            </button>
          </div>
        </div>
      ) : null}

      <div className="mira-mde__body">
        <section
          aria-hidden={showEditor ? "false" : "true"}
          className={cx(
            "mira-mde__pane mira-mde__pane--editor markdown-editor-surface",
            mode === "source"
              ? "markdown-view__editor--source markdown-source-mode"
              : "markdown-view__editor--live-preview markdown-live-preview-mode",
          )}
          data-visible={showEditor}
        >
          <div className="mira-mde__editor-host" ref={editorHostRef} />
        </section>

        {showPreview ? (
          <section
            className="mira-mde__pane mira-mde__pane--preview"
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

MiraMde.displayName = "MiraMde";

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

function themeClassName(theme: MiraTheme): string {
  if (theme === "dark") {
    return "mira-theme-dark theme-dark dark";
  }
  if (theme === "light") {
    return "mira-theme-light theme-light";
  }
  if (theme === "system") {
    return "mira-theme-system";
  }
  return "mira-theme-obsidian theme-light";
}

function useInheritedTheme(
  theme: MiraTheme,
  config: MiraThemeConfig | undefined,
  rootRef: RefObject<HTMLElement | null>,
): Exclude<MiraTheme, "inherit"> {
  const [inheritedTheme, setInheritedTheme] = useState<
    Exclude<MiraTheme, "inherit">
  >(config?.fallback ?? "system");

  useEffect(() => {
    if (theme !== "inherit" || typeof document === "undefined") {
      return;
    }

    const updateTheme = () => {
      setInheritedTheme(resolveInheritedTheme(rootRef.current, config));
    };
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    for (const element of themeLookupTargets(rootRef.current, config)) {
      observer.observe(element, {
        attributeFilter: [
          "class",
          ...(config?.attributeNames ?? [
            "data-theme",
            "data-color-scheme",
            "data-mode",
          ]),
        ],
        attributes: true,
      });
    }

    return () => observer.disconnect();
  }, [config, rootRef, theme]);

  return inheritedTheme;
}

function resolveInheritedTheme(
  element: HTMLElement | null,
  config: MiraThemeConfig | undefined,
): Exclude<MiraTheme, "inherit"> {
  const darkClasses = config?.darkClassNames ?? [
    "dark",
    "theme-dark",
    "mira-theme-dark",
  ];
  const lightClasses = config?.lightClassNames ?? [
    "light",
    "theme-light",
    "mira-theme-light",
  ];
  const darkValues = config?.darkDataThemeValues ?? ["dark", "theme-dark"];
  const lightValues = config?.lightDataThemeValues ?? ["light", "theme-light"];
  const attributeNames = config?.attributeNames ?? [
    "data-theme",
    "data-color-scheme",
    "data-mode",
  ];

  for (const target of themeLookupTargets(element, config)) {
    for (const className of darkClasses) {
      if (target.classList.contains(className)) {
        return "dark";
      }
    }
    for (const className of lightClasses) {
      if (target.classList.contains(className)) {
        return "light";
      }
    }
    for (const attribute of attributeNames) {
      const value = target.getAttribute(attribute)?.toLowerCase();
      if (value && darkValues.includes(value)) {
        return "dark";
      }
      if (value && lightValues.includes(value)) {
        return "light";
      }
    }
  }

  return config?.fallback ?? "system";
}

function themeLookupTargets(
  element: HTMLElement | null,
  config: MiraThemeConfig | undefined,
): HTMLElement[] {
  if (typeof document === "undefined") {
    return [];
  }

  const configuredRoot = config?.root;
  const rootElement = isDocument(configuredRoot)
    ? configuredRoot.documentElement
    : configuredRoot;
  const targets: HTMLElement[] = [];
  let current: HTMLElement | null =
    rootElement ?? element?.parentElement ?? document.documentElement;

  while (current) {
    targets.push(current);
    current = current.parentElement;
  }

  if (document.body && !targets.includes(document.body)) {
    targets.push(document.body);
  }
  if (!targets.includes(document.documentElement)) {
    targets.push(document.documentElement);
  }

  return targets;
}

function isDocument(value: unknown): value is Document {
  return typeof Document !== "undefined" && value instanceof Document;
}
