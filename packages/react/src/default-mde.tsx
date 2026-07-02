import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { MiraEditorSelection } from "@mira-mde/core";
import type { MiraMode } from "@mira-mde/extensions";
import { MiraDefaultToolbar } from "./default-toolbar";
import {
  createMiraDefaultExtensions,
  defaultMiraEditMode,
  MiraFeature,
  resolveMiraDefaultFeatures,
  resolveMiraDefaultEditMode,
  resolveMiraDefaultModes,
} from "./features";
import { cx } from "./hooks";
import { MiraMde } from "./mira-mde";
import type {
  MiraDefaultMdeHandle,
  MiraDefaultMdeProps,
  MiraDefaultToolbarActionContext,
  MiraMdeHandle,
} from "./types";

export const MiraDefaultMde = forwardRef<
  MiraDefaultMdeHandle,
  MiraDefaultMdeProps
>(function MiraDefaultMde(
  {
    assetResolver,
    className,
    defaultEditMode = defaultMiraEditMode,
    defaultMode = defaultEditMode,
    defaultReadonly = false,
    defaultValue = "",
    editorClassName,
    extensions = [],
    fileAdapter,
    featureConfigs = {},
    features = {},
    frontmatterConfig,
    frontmatterOpen = true,
    indentGuides: indentGuidesProp,
    indentWithTabs: indentWithTabsProp,
    indentWidth: indentWidthProp,
    lineWrapping = true,
    linkResolver,
    mode: modeProp,
    onChange,
    onFrontmatterChange,
    onIndentGuidesChange,
    onIndentWidthChange,
    onIndentWithTabsChange,
    onModeChange,
    onReadonlyChange,
    placeholder = "Start writing Markdown...",
    readonly: readonlyProp,
    sourcePath,
    spellcheck = true,
    theme = "obsidian",
    themeConfig,
    toolbarActions = [],
    toolbars = [],
    value: valueProp,
  },
  ref,
) {
  const editorRef = useRef<MiraMdeHandle | null>(null);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [uncontrolledMode, setUncontrolledMode] = useState(defaultMode);
  const [uncontrolledReadonly, setUncontrolledReadonly] =
    useState(defaultReadonly);
  const [uncontrolledIndentGuides, setUncontrolledIndentGuides] =
    useState(true);
  const [uncontrolledIndentWithTabs, setUncontrolledIndentWithTabs] =
    useState(true);
  const [uncontrolledIndentWidth, setUncontrolledIndentWidth] = useState(4);
  const value = valueProp ?? uncontrolledValue;
  const mode = modeProp ?? uncontrolledMode;
  const readonly = readonlyProp ?? uncontrolledReadonly;
  const indentGuides = indentGuidesProp ?? uncontrolledIndentGuides;
  const indentWithTabs = indentWithTabsProp ?? uncontrolledIndentWithTabs;
  const indentWidth = indentWidthProp ?? uncontrolledIndentWidth;
  const resolvedFeatures = useMemo(
    () => resolveMiraDefaultFeatures(features),
    [features],
  );
  const modeOptions = useMemo(
    () => resolveMiraDefaultModes(features),
    [features],
  );
  const resolvedDefaultEditMode = useMemo(
    () => resolveMiraDefaultEditMode(defaultEditMode, modeOptions),
    [defaultEditMode, modeOptions],
  );
  const activeExtensions = useMemo(
    () => [
      ...createMiraDefaultExtensions({ featureConfigs, features }),
      ...extensions,
    ],
    [extensions, featureConfigs, features],
  );

  const handleChange = useCallback(
    (nextValue: string) => {
      if (valueProp === undefined) {
        setUncontrolledValue(nextValue);
      }
      onChange?.(nextValue);
    },
    [onChange, valueProp],
  );

  const applyMode = useCallback(
    (nextMode: MiraMode) => {
      if (!modeOptions.includes(nextMode)) {
        return;
      }
      if (modeProp === undefined) {
        setUncontrolledMode(nextMode);
      }
      onModeChange?.(nextMode);
    },
    [modeOptions, modeProp, onModeChange],
  );

  const applyReadonly = useCallback(
    (nextReadonly: boolean) => {
      if (readonlyProp === undefined) {
        setUncontrolledReadonly(nextReadonly);
      }
      onReadonlyChange?.(nextReadonly);
    },
    [onReadonlyChange, readonlyProp],
  );

  const applyIndentGuides = useCallback(
    (nextEnabled: boolean) => {
      if (indentGuidesProp === undefined) {
        setUncontrolledIndentGuides(nextEnabled);
      }
      onIndentGuidesChange?.(nextEnabled);
    },
    [indentGuidesProp, onIndentGuidesChange],
  );

  const applyIndentWithTabs = useCallback(
    (nextEnabled: boolean) => {
      if (indentWithTabsProp === undefined) {
        setUncontrolledIndentWithTabs(nextEnabled);
      }
      onIndentWithTabsChange?.(nextEnabled);
    },
    [indentWithTabsProp, onIndentWithTabsChange],
  );

  const applyIndentWidth = useCallback(
    (nextWidth: number) => {
      if (indentWidthProp === undefined) {
        setUncontrolledIndentWidth(nextWidth);
      }
      onIndentWidthChange?.(nextWidth);
    },
    [indentWidthProp, onIndentWidthChange],
  );

  const handleSetMarkdown = useCallback(
    (markdown: string) => {
      if (valueProp === undefined) {
        setUncontrolledValue(markdown);
      }
      editorRef.current?.setMarkdown(markdown);
    },
    [valueProp],
  );

  const handleSetMode = useCallback(
    (nextMode: MiraMode) => {
      applyMode(nextMode);
      editorRef.current?.setMode(nextMode);
    },
    [applyMode],
  );

  const handleSetReadonly = useCallback(
    (nextReadonly: boolean) => {
      applyReadonly(nextReadonly);
      editorRef.current?.setReadonly(nextReadonly);
    },
    [applyReadonly],
  );

  const toolbarContext = useMemo<MiraDefaultToolbarActionContext>(
    () => ({
      focus: () => editorRef.current?.focus(),
      getIndentGuides: () => indentGuides,
      getIndentWidth: () => indentWidth,
      getIndentWithTabs: () => indentWithTabs,
      getMarkdown: () => editorRef.current?.getMarkdown() ?? value,
      getMode: () => editorRef.current?.getMode() ?? mode,
      getSelection: () => editorRef.current?.getSelection() ?? null,
      insertMarkdown: (markdown) => editorRef.current?.insertMarkdown(markdown),
      mode,
      readonly,
      setIndentGuides: applyIndentGuides,
      setIndentWidth: applyIndentWidth,
      setIndentWithTabs: applyIndentWithTabs,
      setMarkdown: handleSetMarkdown,
      setMode: handleSetMode,
      setReadonly: handleSetReadonly,
      setSelection: (selection) => editorRef.current?.setSelection(selection),
      value,
    }),
    [
      handleSetMarkdown,
      handleSetMode,
      handleSetReadonly,
      applyIndentGuides,
      applyIndentWidth,
      applyIndentWithTabs,
      indentGuides,
      indentWidth,
      indentWithTabs,
      mode,
      readonly,
      value,
    ],
  );

  useImperativeHandle(
    ref,
    () => ({
      focus() {
        editorRef.current?.focus();
      },
      getMarkdown() {
        return editorRef.current?.getMarkdown() ?? value;
      },
      getMode() {
        return editorRef.current?.getMode() ?? mode;
      },
      getSelection() {
        return editorRef.current?.getSelection() ?? null;
      },
      insertMarkdown(markdown) {
        editorRef.current?.insertMarkdown(markdown);
      },
      setMarkdown: handleSetMarkdown,
      setMode: handleSetMode,
      setReadonly: handleSetReadonly,
      setSelection(selection: MiraEditorSelection) {
        editorRef.current?.setSelection(selection);
      },
    }),
    [handleSetMarkdown, handleSetMode, handleSetReadonly, mode, value],
  );

  return (
    <div
      className={cx("mira-default-ui", className)}
      data-mode={mode}
      data-readonly={readonly}
    >
      {resolvedFeatures[MiraFeature.Toolbar] ? (
        <MiraDefaultToolbar
          context={toolbarContext}
          defaultEditMode={resolvedDefaultEditMode}
          featureConfigs={featureConfigs}
          features={features}
          indentGuides={indentGuides}
          indentWidth={indentWidth}
          indentWithTabs={indentWithTabs}
          mode={mode}
          modeOptions={modeOptions}
          onIndentGuidesChange={applyIndentGuides}
          onIndentWidthChange={applyIndentWidth}
          onIndentWithTabsChange={applyIndentWithTabs}
          readonly={readonly}
          toolbarActions={toolbarActions}
          toolbars={toolbars}
          value={value}
        />
      ) : null}

      <div className="mira-default-ui__editor">
        <MiraMde
          assetResolver={assetResolver}
          blockControls={
            resolvedFeatures[MiraFeature.BlockControls] &&
            featureConfigs[MiraFeature.BlockControls]?.enabled !== false
          }
          className={editorClassName}
          defaultMode={defaultMode}
          defaultReadonly={defaultReadonly}
          defaultValue={defaultValue}
          extensions={activeExtensions}
          fileAdapter={fileAdapter}
          frontmatterConfig={frontmatterConfig}
          frontmatterOpen={
            resolvedFeatures[MiraFeature.Frontmatter] && frontmatterOpen
          }
          indentGuides={indentGuides}
          indentWidth={indentWidth}
          indentWithTabs={indentWithTabs}
          lineWrapping={lineWrapping}
          linkResolver={linkResolver}
          mode={mode}
          onChange={handleChange}
          onFrontmatterChange={onFrontmatterChange}
          onModeChange={applyMode}
          onReadonlyChange={applyReadonly}
          placeholder={placeholder}
          readonly={readonly}
          ref={editorRef}
          sourcePath={sourcePath}
          spellcheck={spellcheck}
          theme={theme}
          themeConfig={themeConfig}
          toolbar={false}
          value={value}
        />
      </div>
    </div>
  );
});

MiraDefaultMde.displayName = "MiraDefaultMde";
