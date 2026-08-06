import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
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
import type {
  MiraEditorSelection,
  MiraMarkdownActionId,
} from "@lapismd/mira/core";
import {
  defineMiraExtension,
  resolveMiraExtensions,
  type MiraBlockActionContext,
  type MiraMode,
  type MiraToolbarIconName,
} from "@lapismd/mira/extensions";
import { MiraEditorToolbar } from "./mira-editor-toolbar";
import {
  createMiraEditorExtensions,
  defaultMiraEditorEditMode,
  MiraFeature,
  resolveMiraEditorBlockControls,
  resolveMiraEditorFeatures,
  resolveMiraEditorEditMode,
  resolveMiraEditorModes,
  resolveMiraEditorToolbarActions,
  resolveMiraEditorToolbarDefinitions,
} from "./features";
import { cx } from "./hooks";
import { Mira } from "./mira";
import {
  miraColorModeAttribute,
  miraColorModeClassName,
  normalizeMiraTheme,
} from "./appearance";
import type {
  MiraEditorHandle,
  MiraEditorProps,
  MiraEditorToolbarActionContext,
  MiraEditorToolbarButtonAction,
  MiraEditorToolbarDefinition,
  MiraHandle,
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

type FrameworkBlockMenuAction = {
  action: MiraEditorToolbarButtonAction;
  group: string;
};

function isBlockMenuButton(
  action: import("./types").MiraEditorToolbarAction,
): action is MiraEditorToolbarButtonAction {
  return (
    action.type !== "dropdown" &&
    action.placements?.includes("block-menu") === true
  );
}

export const MiraEditor = forwardRef<MiraEditorHandle, MiraEditorProps>(
  function MiraEditor(
    {
      assetResolver,
      authoring,
      className,
      defaultEditMode = defaultMiraEditorEditMode,
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
      outlineVariant = "floating",
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
      theme,
      colorMode = "inherit",
      toolbarActions = [],
      toolbars = [],
      value: valueProp,
    },
    ref,
  ) {
    const editorRef = useRef<MiraHandle | null>(null);
    const toolbarContextRef = useRef<MiraEditorToolbarActionContext | null>(
      null,
    );
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
      () => resolveMiraEditorFeatures(features),
      [features],
    );
    const modeOptions = useMemo(
      () => resolveMiraEditorModes(features),
      [features],
    );
    const resolvedDefaultEditMode = useMemo(
      () => resolveMiraEditorEditMode(defaultEditMode, modeOptions),
      [defaultEditMode, modeOptions],
    );
    const frameworkBlockMenuActions = useMemo<FrameworkBlockMenuAction[]>(
      () => [
        ...resolveMiraEditorToolbarActions({
          featureConfigs,
          toolbarActions,
        })
          .filter(isBlockMenuButton)
          .map((action) => ({ action, group: action.group ?? "Actions" })),
        ...resolveMiraEditorToolbarDefinitions({
          featureConfigs,
          toolbars,
        }).flatMap((toolbar) =>
          toolbar.items.filter(isBlockMenuButton).map((action) => ({
            action,
            group: action.group ?? toolbar.label ?? "Actions",
          })),
        ),
      ],
      [featureConfigs, toolbarActions, toolbars],
    );
    const frameworkBlockMenuExtension = useMemo(
      () =>
        frameworkBlockMenuActions.length > 0
          ? defineMiraExtension({
              name: "mira-editor-react-block-menu-actions",
              blockActions: frameworkBlockMenuActions.map(
                ({ action, group }) => ({
                  id: `mira-editor-${action.id}`,
                  label: action.label,
                  group,
                  placements: ["block-menu"],
                  shortcut: action.shortcut,
                  disabled(context) {
                    const base = toolbarContextRef.current;
                    if (!base) {
                      return true;
                    }
                    const disabled = action.disabled;
                    const actionContext = createBlockToolbarActionContext(
                      base,
                      context,
                    );
                    return typeof disabled === "function"
                      ? disabled(actionContext)
                      : (disabled ?? false);
                  },
                  renderIcon(target) {
                    const root = createRoot(target);
                    const Icon = action.icon;
                    root.render(
                      <Icon aria-hidden="true" className="mira-editor__icon" />,
                    );
                    return () => root.unmount();
                  },
                  run(context) {
                    const base = toolbarContextRef.current;
                    if (base) {
                      action.run(
                        createBlockToolbarActionContext(base, context),
                      );
                    }
                  },
                }),
              ),
            })
          : null,
      [frameworkBlockMenuActions],
    );
    const activeExtensions = useMemo(
      () => [
        ...createMiraEditorExtensions({ featureConfigs, features }),
        ...(frameworkBlockMenuExtension ? [frameworkBlockMenuExtension] : []),
        ...extensions,
      ],
      [extensions, featureConfigs, features, frameworkBlockMenuExtension],
    );
    const blockControls = useMemo(
      () => resolveMiraEditorBlockControls({ featureConfigs, features }),
      [featureConfigs, features],
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
      const groups = new Map<string, MiraEditorToolbarDefinition>();

      for (const item of resolvedExtensionContributions.toolbarItems) {
        if (item.placements && !item.placements.includes("toolbar")) {
          continue;
        }
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

    const toolbarContext = useMemo<MiraEditorToolbarActionContext>(
      () => ({
        applyMarkdownAction: (action) =>
          editorRef.current?.applyMarkdownAction(action) ?? false,
        focus: () => editorRef.current?.focus(),
        getIndentGuides: () => indentGuides,
        getIndentWidth: () => indentWidth,
        getIndentWithTabs: () => indentWithTabs,
        getMarkdown: () => editorRef.current?.getMarkdown() ?? value,
        getMode: () => editorRef.current?.getMode() ?? mode,
        getSelection: () => editorRef.current?.getSelection() ?? null,
        insertImage: () => editorRef.current?.insertImage(),
        insertMarkdown: (markdown) =>
          editorRef.current?.insertMarkdown(markdown),
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
    toolbarContextRef.current = toolbarContext;

    useImperativeHandle(
      ref,
      () => ({
        applyMarkdownAction(action: MiraMarkdownActionId) {
          if (readonly || mode === "preview") {
            return false;
          }
          return editorRef.current?.applyMarkdownAction(action) ?? false;
        },
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
        readonly,
        resolvedExtensionContributions.commands,
        value,
      ],
    );

    return (
      <div
        className={cx(
          "mira-editor",
          miraColorModeClassName(colorMode),
          className,
        )}
        data-mira-theme={normalizeMiraTheme(theme)}
        data-mira-color-mode={miraColorModeAttribute(colorMode)}
        data-mode={mode}
        data-readonly={readonly}
      >
        {resolvedFeatures[MiraFeature.Toolbar] ? (
          <MiraEditorToolbar
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

        <div className="mira-editor__editor">
          <Mira
            assetResolver={assetResolver}
            authoring={authoring}
            blockControls={blockControls}
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
            outlineVariant={outlineVariant}
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
            colorMode={colorMode}
            toolbar={false}
            value={value}
          />
        </div>
      </div>
    );
  },
);

MiraEditor.displayName = "MiraEditor";

function createBlockToolbarActionContext(
  base: MiraEditorToolbarActionContext,
  context: MiraBlockActionContext,
): MiraEditorToolbarActionContext {
  return {
    ...base,
    block: context.block,
    blocks: context.blocks,
    handle: context.handle,
    affectedRange: context.affectedRange,
    replaceRange: context.replaceRange,
  };
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "extensions"
  );
}
