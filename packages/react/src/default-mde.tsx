import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Check,
  Code,
  Command,
  Image,
  Link,
  Play,
  RotateCcw,
  Save,
  Sparkles,
  Table2,
  WandSparkles,
} from "lucide-react";
import type { MiraEditorSelection } from "@mira-mde/core";
import {
  resolveMiraExtensions,
  type MiraMode,
  type MiraToolbarIconName,
} from "@mira-mde/extensions";
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
  MiraDefaultToolbarDefinition,
  MiraMdeHandle,
  MiraReactIcon,
} from "./types";

const extensionToolbarIcons: Record<MiraToolbarIconName, MiraReactIcon> = {
  check: Check,
  code: Code,
  command: Command,
  image: Image,
  link: Link,
  play: Play,
  "rotate-ccw": RotateCcw,
  save: Save,
  sparkles: Sparkles,
  table: Table2,
  "wand-sparkles": WandSparkles,
};

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
    imageConfig,
    featureConfigs = {},
    features = {},
    frontmatterConfig,
    frontmatterOpen = true,
    headingIds = false,
    headingIdPrefix = "",
    htmlPolicy = "trusted",
    emoji = false,
    outline = false,
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
  const resolvedExtensionContributions = useMemo(
    () =>
      resolveMiraExtensions(activeExtensions, {
        mode,
        readonly,
        sourcePath,
      }),
    [activeExtensions, mode, readonly, sourcePath],
  );
  const extensionToolbars = useMemo(() => {
    const groups = new Map<string, MiraDefaultToolbarDefinition>();

    for (const item of resolvedExtensionContributions.toolbarItems) {
      const align = item.align ?? "start";
      const label = item.group ?? "Extensions";
      const key = `${align}:${label}`;
      let group = groups.get(key);
      if (!group) {
        group = {
          id: `extension-${slugify(label)}-${align}`,
          label,
          align,
          items: [],
        };
        groups.set(key, group);
      }

      const Icon = extensionToolbarIcons[item.icon ?? "command"] ?? Command;
      group.items.push({
        id: `extension-${item.id}`,
        label: item.label,
        tooltip: item.tooltip,
        icon: Icon,
        disabled: () =>
          editorRef.current
            ? !editorRef.current.isCommandEnabled(item.command)
            : false,
        run: () => {
          editorRef.current?.executeCommand(item.command);
        },
      });
    }

    return [...groups.values()];
  }, [resolvedExtensionContributions.toolbarItems]);

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
      insertImage: () => editorRef.current?.insertImage(),
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
      executeCommand(commandId) {
        return editorRef.current?.executeCommand(commandId) ?? false;
      },
      focus() {
        editorRef.current?.focus();
      },
      getMarkdown() {
        return editorRef.current?.getMarkdown() ?? value;
      },
      getCommands() {
        return (
          editorRef.current?.getCommands() ??
          resolvedExtensionContributions.commands
        );
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
      insertImage() {
        editorRef.current?.insertImage();
      },
      isCommandEnabled(commandId) {
        return editorRef.current?.isCommandEnabled(commandId) ?? false;
      },
      setMarkdown: handleSetMarkdown,
      setMode: handleSetMode,
      setReadonly: handleSetReadonly,
      setSelection(selection: MiraEditorSelection) {
        editorRef.current?.setSelection(selection);
      },
    }),
    [
      handleSetMarkdown,
      handleSetMode,
      handleSetReadonly,
      mode,
      resolvedExtensionContributions.commands,
      value,
    ],
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
          toolbars={[...extensionToolbars, ...toolbars]}
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
          imageConfig={imageConfig}
          frontmatterConfig={frontmatterConfig}
          frontmatterOpen={
            resolvedFeatures[MiraFeature.Frontmatter] && frontmatterOpen
          }
          headingIds={headingIds}
          headingIdPrefix={headingIdPrefix}
          htmlPolicy={htmlPolicy}
          emoji={emoji}
          outline={outline}
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

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "extensions"
  );
}
