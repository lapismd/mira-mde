import {
  Bold,
  BookOpen,
  Braces,
  Check,
  Code,
  Columns2,
  Ellipsis,
  FileCode,
  Heading1,
  Image,
  Italic,
  Link,
  List,
  ListChecks,
  PencilLine,
  Quote,
  Table2,
  TableCellsSplit,
  Workflow,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { MiraMode } from "@lapismd/mira/extensions";
import {
  isMiraEditMode,
  miraDefaultToolbarItemLabels,
  miraViewOptionsLabel,
  miraViewToggleLabel,
  resolveMiraModeAfterSplit,
  resolveMiraViewModeMenuItems,
  resolveMiraViewToggleMode,
  templateForMiraToolbarItem,
  type MiraViewModeMenuItem as MiraBaseViewModeMenuItem,
} from "@mira-mde/default-ui";
import {
  MiraFeature,
  defaultMiraEditMode,
  resolveMiraDefaultFeatures,
  resolveMiraDefaultEditMode,
  resolveMiraDefaultModes,
  resolveMiraDefaultToolbarActions,
  resolveMiraDefaultToolbarDefinitions,
  resolveMiraDefaultToolbarItems,
} from "./features";
import { cx } from "./hooks";
import type {
  MiraDefaultToolbarAction,
  MiraDefaultToolbarActionContext,
  MiraDefaultToolbarDefinition,
  MiraDefaultToolbarDropdownAction,
  MiraDefaultEditMode,
  MiraDefaultToolbarItem,
  MiraDefaultToolbarMenuItem,
  MiraDefaultToolbarProps,
  MiraReactIcon,
} from "./types";

type ViewModeMenuItem = {
  mode: MiraBaseViewModeMenuItem["mode"];
  label: MiraBaseViewModeMenuItem["label"];
  icon: MiraReactIcon;
  checked: MiraBaseViewModeMenuItem["checked"];
};

const modeIcons: Record<MiraMode, MiraReactIcon> = {
  source: FileCode,
  "live-preview": PencilLine,
  preview: BookOpen,
  split: Columns2,
};

const toolbarItemIcons: Record<MiraDefaultToolbarItem, MiraReactIcon> = {
  heading: Heading1,
  bold: Bold,
  italic: Italic,
  quote: Quote,
  bulletList: List,
  taskList: ListChecks,
  link: Link,
  image: Image,
  table: Table2,
  gridTable: TableCellsSplit,
  code: Code,
  math: Braces,
  mermaid: Workflow,
};

export function MiraDefaultToolbar({
  className,
  context,
  defaultEditMode = defaultMiraEditMode,
  featureConfigs = {},
  features = {},
  indentGuides = true,
  indentWithTabs = true,
  indentWidth = 4,
  mode = "live-preview",
  modeOptions: modeOptionsProp,
  onIndentGuidesChange,
  onIndentWidthChange,
  onIndentWithTabsChange,
  onInsertMarkdown,
  onInsertImage,
  onModeChange,
  readonly = false,
  showModeSwitch = true,
  toolbarActions = [],
  toolbars = [],
  value = "",
}: MiraDefaultToolbarProps): React.ReactElement {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [lastNonSplitMode, setLastNonSplitMode] =
    useState<MiraMode>(defaultEditMode);
  const [localIndentGuides, setLocalIndentGuides] = useState(indentGuides);
  const [localIndentWithTabs, setLocalIndentWithTabs] =
    useState(indentWithTabs);
  const [localIndentWidth, setLocalIndentWidth] = useState(indentWidth);
  const resolvedFeatures = useMemo(
    () => resolveMiraDefaultFeatures(features),
    [features],
  );
  const modeOptions = useMemo(
    () => modeOptionsProp ?? resolveMiraDefaultModes(features),
    [features, modeOptionsProp],
  );
  const toolbarItems = useMemo(
    () => resolveMiraDefaultToolbarItems({ featureConfigs, features }),
    [featureConfigs, features],
  );
  const customToolbarActions = useMemo(
    () =>
      resolveMiraDefaultToolbarActions({
        featureConfigs,
        toolbarActions,
      }),
    [featureConfigs, toolbarActions],
  );
  const customToolbars = useMemo(
    () =>
      resolveMiraDefaultToolbarDefinitions({
        featureConfigs,
        toolbars,
      }),
    [featureConfigs, toolbars],
  );
  const startToolbars = useMemo(
    () => customToolbars.filter((toolbar) => toolbar.align !== "end"),
    [customToolbars],
  );
  const endToolbars = useMemo(
    () => customToolbars.filter((toolbar) => toolbar.align === "end"),
    [customToolbars],
  );
  const modeSwitchVisible =
    showModeSwitch &&
    resolvedFeatures[MiraFeature.ModeSwitch] &&
    modeOptions.length > 1;
  const resolvedDefaultEditMode = useMemo(
    () => resolveMiraDefaultEditMode(defaultEditMode, modeOptions),
    [defaultEditMode, modeOptions],
  );
  const editModeOptions = useMemo(
    () => modeOptions.filter((modeOption) => isMiraEditMode(modeOption)),
    [modeOptions],
  );
  const viewModeMenuItems = useMemo(
    () =>
      resolveMiraViewModeMenuItems({
        mode,
        modeOptions,
        resolvedDefaultEditMode,
      }).map((item) => ({
        ...item,
        icon: modeIcons[item.mode],
      })),
    [mode, modeOptions, resolvedDefaultEditMode],
  );
  const viewModeToggleVisible =
    modeSwitchVisible &&
    modeOptions.includes("preview") &&
    editModeOptions.length > 0;
  const splitModeVisible = modeSwitchVisible && modeOptions.includes("split");
  const editorSettingsMenuVisible = true;
  const viewModeOverflowVisible =
    (modeSwitchVisible && viewModeMenuItems.length > 0) ||
    editorSettingsMenuVisible;
  const toolbarHasStartContent =
    startToolbars.length > 0 ||
    toolbarItems.length > 0 ||
    customToolbarActions.length > 0;

  const fallbackContext = useCallback(
    (): MiraDefaultToolbarActionContext => ({
      focus: () => undefined,
      getIndentGuides: () => localIndentGuides,
      getIndentWidth: () => localIndentWidth,
      getIndentWithTabs: () => localIndentWithTabs,
      getMarkdown: () => value,
      getMode: () => mode,
      getSelection: () => null,
      insertMarkdown(markdown) {
        onInsertMarkdown?.(markdown);
      },
      insertImage() {
        onInsertImage?.();
      },
      setIndentGuides(nextEnabled) {
        setLocalIndentGuides(nextEnabled);
        onIndentGuidesChange?.(nextEnabled);
      },
      setIndentWidth(nextWidth) {
        setLocalIndentWidth(nextWidth);
        onIndentWidthChange?.(nextWidth);
      },
      setIndentWithTabs(nextEnabled) {
        setLocalIndentWithTabs(nextEnabled);
        onIndentWithTabsChange?.(nextEnabled);
      },
      mode,
      readonly,
      setMarkdown: () => undefined,
      setMode(nextMode) {
        onModeChange?.(nextMode);
      },
      setReadonly: () => undefined,
      setSelection: () => undefined,
      value,
    }),
    [
      localIndentGuides,
      localIndentWidth,
      localIndentWithTabs,
      mode,
      onIndentGuidesChange,
      onIndentWidthChange,
      onIndentWithTabsChange,
      onInsertImage,
      onInsertMarkdown,
      onModeChange,
      readonly,
      value,
    ],
  );

  const actionContext = useCallback(
    () => context ?? fallbackContext(),
    [context, fallbackContext],
  );

  const dynamicBoolean = useCallback(
    (
      value:
        | boolean
        | ((context: MiraDefaultToolbarActionContext) => boolean)
        | undefined,
    ): boolean => {
      if (typeof value === "function") {
        return value(actionContext());
      }
      return value ?? false;
    },
    [actionContext],
  );

  const applyMode = useCallback(
    (nextMode: MiraMode) => {
      if (!modeOptions.includes(nextMode)) {
        return;
      }
      context?.setMode(nextMode);
      onModeChange?.(nextMode);
      setOpenMenu(null);
    },
    [context, modeOptions, onModeChange],
  );

  const getIndentGuidesSetting = useCallback(
    () => actionContext().getIndentGuides?.() ?? localIndentGuides,
    [actionContext, localIndentGuides],
  );

  const getIndentWidthSetting = useCallback(
    () => actionContext().getIndentWidth?.() ?? localIndentWidth,
    [actionContext, localIndentWidth],
  );

  const getIndentWithTabsSetting = useCallback(
    () => actionContext().getIndentWithTabs?.() ?? localIndentWithTabs,
    [actionContext, localIndentWithTabs],
  );

  const setIndentGuidesSetting = useCallback(
    (nextEnabled: boolean) => {
      const ctx = actionContext();
      if (ctx.setIndentGuides) {
        ctx.setIndentGuides(nextEnabled);
      } else {
        setLocalIndentGuides(nextEnabled);
        onIndentGuidesChange?.(nextEnabled);
      }
    },
    [actionContext, onIndentGuidesChange],
  );

  const setIndentWidthSetting = useCallback(
    (nextWidth: number) => {
      const ctx = actionContext();
      if (ctx.setIndentWidth) {
        ctx.setIndentWidth(nextWidth);
      } else {
        setLocalIndentWidth(nextWidth);
        onIndentWidthChange?.(nextWidth);
      }
    },
    [actionContext, onIndentWidthChange],
  );

  const setIndentWithTabsSetting = useCallback(
    (nextEnabled: boolean) => {
      const ctx = actionContext();
      if (ctx.setIndentWithTabs) {
        ctx.setIndentWithTabs(nextEnabled);
      } else {
        setLocalIndentWithTabs(nextEnabled);
        onIndentWithTabsChange?.(nextEnabled);
      }
    },
    [actionContext, onIndentWithTabsChange],
  );

  useEffect(() => {
    setLocalIndentGuides(indentGuides);
  }, [indentGuides]);

  useEffect(() => {
    setLocalIndentWithTabs(indentWithTabs);
  }, [indentWithTabs]);

  useEffect(() => {
    setLocalIndentWidth(indentWidth);
  }, [indentWidth]);

  const modeAfterSplit = useCallback((): MiraMode => {
    return resolveMiraModeAfterSplit({
      lastNonSplitMode,
      modeOptions,
      resolvedDefaultEditMode,
    });
  }, [lastNonSplitMode, modeOptions, resolvedDefaultEditMode]);

  const handleSplitMode = useCallback(() => {
    applyMode(mode === "split" ? modeAfterSplit() : "split");
  }, [applyMode, mode, modeAfterSplit]);

  useEffect(() => {
    if (mode !== "split" && modeOptions.includes(mode)) {
      setLastNonSplitMode(mode);
    }
  }, [mode, modeOptions]);

  useEffect(() => {
    if (!openMenu) {
      return;
    }

    function handlePointerDown(event: PointerEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenu]);

  const renderAction = useCallback(
    (action: MiraDefaultToolbarAction, align: "start" | "end" = "start") => {
      if (isDropdownAction(action)) {
        return (
          <DropdownAction
            action={action}
            align={align}
            dynamicBoolean={dynamicBoolean}
            isOpen={openMenu === action.id}
            key={action.id}
            menuItemIcon={(item) => menuItemIcon(item, dynamicBoolean)}
            onMenuItemRun={(item) => {
              runMenuItem(item, actionContext, dynamicBoolean);
              setOpenMenu(null);
            }}
            onToggle={() =>
              setOpenMenu((current) =>
                current === action.id ? null : action.id,
              )
            }
          />
        );
      }

      const Icon = action.icon;
      return (
        <button
          aria-label={action.label}
          aria-pressed={dynamicBoolean(action.pressed) ? "true" : undefined}
          className="mira-toolbar__button"
          disabled={dynamicBoolean(action.disabled)}
          key={action.id}
          onClick={() => action.run(actionContext())}
          title={action.tooltip ?? action.label}
          type="button"
        >
          <Icon aria-hidden="true" className="mira-default-ui__icon" />
        </button>
      );
    },
    [actionContext, dynamicBoolean, openMenu],
  );

  return (
    <div
      className="mira-default-toolbar__event-root"
      ref={rootRef}
      role="presentation"
    >
      <div
        aria-label="Markdown editor toolbar"
        className={cx(
          "mira-toolbar mira-default-toolbar mira-default-ui__toolbar",
          className,
        )}
        role="toolbar"
      >
        {startToolbars.map((toolbar) => (
          <ToolbarSection key={toolbar.id} toolbar={toolbar}>
            {toolbar.items.map((action) => renderAction(action))}
          </ToolbarSection>
        ))}

        {startToolbars.length > 0 ? <Separator /> : null}

        {toolbarItems.length > 0 ? (
          <div
            aria-label="Insert"
            className="mira-default-ui__toolbar-section"
            role="group"
          >
            {toolbarItems.map((item) => {
              const Icon = toolbarItemIcons[item];
              return (
                <button
                  aria-label={miraDefaultToolbarItemLabels[item]}
                  className="mira-toolbar__button"
                  disabled={readonly}
                  key={item}
                  onClick={() =>
                    item === "image" && actionContext().insertImage
                      ? actionContext().insertImage()
                      : actionContext().insertMarkdown(
                          templateForMiraToolbarItem(item),
                        )
                  }
                  title={miraDefaultToolbarItemLabels[item]}
                  type="button"
                >
                  <Icon aria-hidden="true" className="mira-default-ui__icon" />
                </button>
              );
            })}
          </div>
        ) : null}

        {customToolbarActions.length > 0 ? (
          <>
            {toolbarItems.length > 0 ? <Separator /> : null}
            <div
              aria-label="Custom actions"
              className="mira-default-ui__toolbar-section"
              role="group"
            >
              {customToolbarActions.map((action) => renderAction(action))}
            </div>
          </>
        ) : null}

        <div className="mira-default-toolbar__spacer" />

        {endToolbars.map((toolbar) => (
          <ToolbarSection key={toolbar.id} toolbar={toolbar}>
            {toolbar.items.map((action) => renderAction(action, "end"))}
          </ToolbarSection>
        ))}

        {viewModeToggleVisible ||
        splitModeVisible ||
        viewModeOverflowVisible ? (
          <>
            {toolbarHasStartContent || endToolbars.length > 0 ? (
              <Separator />
            ) : null}
            <div
              aria-label="View controls"
              className="mira-default-ui__toolbar-section"
              role="group"
            >
              {viewModeToggleVisible ? (
                <ViewModeToggle
                  mode={mode}
                  onApplyMode={applyMode}
                  resolvedDefaultEditMode={resolvedDefaultEditMode}
                />
              ) : null}
              {splitModeVisible ? (
                <button
                  aria-label="Split"
                  aria-pressed={mode === "split" ? "true" : undefined}
                  className="mira-toolbar__button"
                  onClick={handleSplitMode}
                  title="Split"
                  type="button"
                >
                  <Columns2
                    aria-hidden="true"
                    className="mira-default-ui__icon"
                  />
                </button>
              ) : null}
              {viewModeOverflowVisible ? (
                <ViewModeDropdown
                  getIndentGuides={getIndentGuidesSetting}
                  getIndentWidth={getIndentWidthSetting}
                  getIndentWithTabs={getIndentWithTabsSetting}
                  items={viewModeMenuItems}
                  isOpen={openMenu === "view-mode"}
                  onApplyMode={applyMode}
                  onSetIndentGuides={setIndentGuidesSetting}
                  onSetIndentWidth={setIndentWidthSetting}
                  onSetIndentWithTabs={setIndentWithTabsSetting}
                  onToggle={() =>
                    setOpenMenu((current) =>
                      current === "view-mode" ? null : "view-mode",
                    )
                  }
                />
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function ToolbarSection({
  children,
  toolbar,
}: {
  children: ReactNode;
  toolbar: MiraDefaultToolbarDefinition;
}): React.ReactElement {
  return (
    <div
      aria-label={toolbar.label ?? toolbar.id}
      className="mira-default-ui__toolbar-section"
      role="group"
    >
      {children}
    </div>
  );
}

function Separator(): React.ReactElement {
  return (
    <div className="mira-separator--vertical mira-default-ui__separator" />
  );
}

function DropdownAction({
  action,
  align,
  dynamicBoolean,
  isOpen,
  menuItemIcon: resolveMenuItemIcon,
  onMenuItemRun,
  onToggle,
}: {
  action: MiraDefaultToolbarDropdownAction;
  align: "start" | "end";
  dynamicBoolean: (
    value:
      | boolean
      | ((context: MiraDefaultToolbarActionContext) => boolean)
      | undefined,
  ) => boolean;
  isOpen: boolean;
  menuItemIcon: (item: MiraDefaultToolbarMenuItem) => MiraReactIcon | undefined;
  onMenuItemRun: (item: MiraDefaultToolbarMenuItem) => void;
  onToggle: () => void;
}): React.ReactElement {
  const Icon = action.icon;
  return (
    <div className="mira-react-dropdown">
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={action.label}
        className="mira-toolbar__button"
        disabled={dynamicBoolean(action.disabled)}
        onClick={onToggle}
        title={action.tooltip ?? action.label}
        type="button"
      >
        <Icon aria-hidden="true" className="mira-default-ui__icon" />
      </button>
      {isOpen ? (
        <div
          className={cx(
            "mira-react-dropdown__content",
            align === "end" && "mira-react-dropdown__content--end",
          )}
          data-slot="dropdown-menu-content"
          role="menu"
        >
          {action.items.map((item, index) => (
            <MenuItem
              disabled={isMenuItemDisabled(item, dynamicBoolean)}
              icon={resolveMenuItemIcon(item)}
              item={item}
              key={menuItemKey(item, index)}
              onRun={onMenuItemRun}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ViewModeToggle({
  mode,
  onApplyMode,
  resolvedDefaultEditMode,
}: {
  mode: MiraMode;
  onApplyMode: (mode: MiraMode) => void;
  resolvedDefaultEditMode: MiraDefaultEditMode;
}): React.ReactElement {
  const isPreview = mode === "preview";
  const Icon = isPreview ? PencilLine : BookOpen;
  const label = miraViewToggleLabel(mode);

  return (
    <button
      aria-label={label}
      className="mira-toolbar__button"
      onClick={() =>
        onApplyMode(resolveMiraViewToggleMode(mode, resolvedDefaultEditMode))
      }
      title={label}
      type="button"
    >
      <Icon aria-hidden="true" className="mira-default-ui__icon" />
    </button>
  );
}

function ViewModeDropdown({
  getIndentGuides,
  getIndentWidth,
  getIndentWithTabs,
  isOpen,
  items,
  onApplyMode,
  onSetIndentGuides,
  onSetIndentWidth,
  onSetIndentWithTabs,
  onToggle,
}: {
  getIndentGuides: () => boolean;
  getIndentWidth: () => number;
  getIndentWithTabs: () => boolean;
  isOpen: boolean;
  items: ViewModeMenuItem[];
  onApplyMode: (mode: MiraMode) => void;
  onSetIndentGuides: (enabled: boolean) => void;
  onSetIndentWidth: (width: number) => void;
  onSetIndentWithTabs: (enabled: boolean) => void;
  onToggle: () => void;
}): React.ReactElement {
  const tabSizeOptions = [2, 4, 8];

  return (
    <div className="mira-react-dropdown">
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={miraViewOptionsLabel}
        className="mira-toolbar__button"
        onClick={onToggle}
        title={miraViewOptionsLabel}
        type="button"
      >
        <Ellipsis aria-hidden="true" className="mira-default-ui__icon" />
      </button>
      {isOpen ? (
        <div
          className="mira-react-dropdown__content mira-react-dropdown__content--end"
          data-slot="dropdown-menu-content"
          role="menu"
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className="mira-react-menu-button"
                data-slot="dropdown-menu-item"
                key={item.mode}
                onClick={() => onApplyMode(item.mode)}
                role="menuitem"
                type="button"
              >
                <Icon
                  aria-hidden="true"
                  className="mira-default-toolbar__menu-icon"
                />
                <span>{item.label}</span>
                {item.checked ? (
                  <Check
                    aria-hidden="true"
                    className="mira-default-toolbar__menu-check"
                  />
                ) : null}
              </button>
            );
          })}
          {items.length > 0 ? (
            <div data-slot="dropdown-menu-separator" role="separator" />
          ) : null}
          <div data-slot="dropdown-menu-label">Editor</div>
          <button
            className="mira-react-menu-button"
            data-slot="dropdown-menu-item"
            onClick={() => onSetIndentGuides(!getIndentGuides())}
            role="menuitem"
            type="button"
          >
            {getIndentGuides() ? (
              <Check
                aria-hidden="true"
                className="mira-default-toolbar__menu-icon"
              />
            ) : null}
            <span>Indentation guides</span>
          </button>
          <button
            className="mira-react-menu-button"
            data-slot="dropdown-menu-item"
            onClick={() => onSetIndentWithTabs(!getIndentWithTabs())}
            role="menuitem"
            type="button"
          >
            {getIndentWithTabs() ? (
              <Check
                aria-hidden="true"
                className="mira-default-toolbar__menu-icon"
              />
            ) : null}
            <span>Use tabs for indentation</span>
          </button>
          <div data-slot="dropdown-menu-separator" role="separator" />
          <div data-slot="dropdown-menu-label">Tab size</div>
          {tabSizeOptions.map((size) => (
            <button
              className="mira-react-menu-button"
              data-slot="dropdown-menu-item"
              key={size}
              onClick={() => onSetIndentWidth(size)}
              role="menuitem"
              type="button"
            >
              {getIndentWidth() === size ? (
                <Check
                  aria-hidden="true"
                  className="mira-default-toolbar__menu-icon"
                />
              ) : null}
              <span>{size} spaces</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  disabled,
  icon: Icon,
  item,
  onRun,
}: {
  disabled: boolean;
  icon?: MiraReactIcon;
  item: MiraDefaultToolbarMenuItem;
  onRun: (item: MiraDefaultToolbarMenuItem) => void;
}): React.ReactElement {
  if (item.type === "separator") {
    return <div data-slot="dropdown-menu-separator" role="separator" />;
  }
  if (item.type === "label") {
    return <div data-slot="dropdown-menu-label">{item.label}</div>;
  }

  return (
    <button
      className="mira-react-menu-button"
      data-disabled={disabled ? "" : undefined}
      data-slot="dropdown-menu-item"
      disabled={disabled}
      onClick={() => onRun(item)}
      role="menuitem"
      type="button"
    >
      {Icon ? (
        <Icon aria-hidden="true" className="mira-default-toolbar__menu-icon" />
      ) : null}
      <span>{item.label}</span>
      {item.shortcut ? (
        <span data-slot="dropdown-menu-shortcut">{item.shortcut}</span>
      ) : null}
    </button>
  );
}

function isDropdownAction(
  action: MiraDefaultToolbarAction,
): action is MiraDefaultToolbarDropdownAction {
  return action.type === "dropdown";
}

function menuItemKey(item: MiraDefaultToolbarMenuItem, index: number): string {
  const fallback = item.type === "separator" ? index : item.label;
  return `${item.type ?? "item"}-${item.id ?? fallback}`;
}

function isMenuItemDisabled(
  item: MiraDefaultToolbarMenuItem,
  dynamicBoolean: (
    value:
      | boolean
      | ((context: MiraDefaultToolbarActionContext) => boolean)
      | undefined,
  ) => boolean,
): boolean {
  return (
    item.type !== "label" &&
    item.type !== "separator" &&
    dynamicBoolean(item.disabled)
  );
}

function isMenuItemChecked(
  item: MiraDefaultToolbarMenuItem,
  dynamicBoolean: (
    value:
      | boolean
      | ((context: MiraDefaultToolbarActionContext) => boolean)
      | undefined,
  ) => boolean,
): boolean {
  return (
    item.type !== "label" &&
    item.type !== "separator" &&
    dynamicBoolean(item.checked)
  );
}

function menuItemIcon(
  item: MiraDefaultToolbarMenuItem,
  dynamicBoolean: (
    value:
      | boolean
      | ((context: MiraDefaultToolbarActionContext) => boolean)
      | undefined,
  ) => boolean,
): MiraReactIcon | undefined {
  if (item.type === "label" || item.type === "separator") {
    return undefined;
  }
  return (
    item.icon ?? (isMenuItemChecked(item, dynamicBoolean) ? Check : undefined)
  );
}

function runMenuItem(
  item: MiraDefaultToolbarMenuItem,
  actionContext: () => MiraDefaultToolbarActionContext,
  dynamicBoolean: (
    value:
      | boolean
      | ((context: MiraDefaultToolbarActionContext) => boolean)
      | undefined,
  ) => boolean,
): void {
  if (
    item.type === "label" ||
    item.type === "separator" ||
    isMenuItemDisabled(item, dynamicBoolean)
  ) {
    return;
  }
  item.run(actionContext());
}
