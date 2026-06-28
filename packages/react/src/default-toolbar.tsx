import {
  Bold,
  BookOpen,
  Braces,
  Check,
  Code,
  Columns2,
  FileCode,
  Heading1,
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
import type { MiraMode } from "@mira-mde/extensions";
import {
  MiraFeature,
  resolveMiraDefaultFeatures,
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
  MiraDefaultToolbarItem,
  MiraDefaultToolbarMenuItem,
  MiraDefaultToolbarProps,
  MiraReactIcon,
} from "./types";

type ViewModeMenuItem = {
  mode: MiraMode;
  label: string;
  icon: MiraReactIcon;
  checked: boolean;
};

const modeLabels: Record<MiraMode, string> = {
  source: "Source mode",
  "live-preview": "Edit",
  preview: "Preview",
  split: "Split",
};

const modeIcons: Record<MiraMode, MiraReactIcon> = {
  source: FileCode,
  "live-preview": PencilLine,
  preview: BookOpen,
  split: Columns2,
};

const toolbarItemLabels: Record<MiraDefaultToolbarItem, string> = {
  heading: "Heading",
  bold: "Bold",
  italic: "Italic",
  quote: "Blockquote",
  bulletList: "Bullet list",
  taskList: "Task list",
  link: "Link",
  table: "Table",
  gridTable: "Grid table",
  code: "Code block",
  math: "Math",
  mermaid: "Mermaid diagram",
};

const toolbarItemIcons: Record<MiraDefaultToolbarItem, MiraReactIcon> = {
  heading: Heading1,
  bold: Bold,
  italic: Italic,
  quote: Quote,
  bulletList: List,
  taskList: ListChecks,
  link: Link,
  table: Table2,
  gridTable: TableCellsSplit,
  code: Code,
  math: Braces,
  mermaid: Workflow,
};

export function MiraDefaultToolbar({
  className,
  context,
  featureConfigs = {},
  features = {},
  mode = "live-preview",
  modeOptions: modeOptionsProp,
  onInsertMarkdown,
  onModeChange,
  readonly = false,
  showModeSwitch = true,
  toolbarActions = [],
  toolbars = [],
  value = "",
}: MiraDefaultToolbarProps): React.ReactElement {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [lastEditMode, setLastEditMode] = useState<MiraMode>("live-preview");
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
  const viewModeMenuItems = useMemo(
    () => resolveViewModeMenuItems(mode, modeOptions),
    [mode, modeOptions],
  );
  const viewModeControlVisible =
    modeSwitchVisible && (mode === "preview" || viewModeMenuItems.length > 0);
  const splitModeVisible = modeSwitchVisible && modeOptions.includes("split");
  const toolbarHasStartContent =
    startToolbars.length > 0 ||
    toolbarItems.length > 0 ||
    customToolbarActions.length > 0;

  const fallbackContext = useCallback(
    (): MiraDefaultToolbarActionContext => ({
      focus: () => undefined,
      getMarkdown: () => value,
      getMode: () => mode,
      getSelection: () => null,
      insertMarkdown(markdown) {
        onInsertMarkdown?.(markdown);
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
    [mode, onInsertMarkdown, onModeChange, readonly, value],
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

  const preferredEditMode = useCallback((): MiraMode => {
    if (lastEditMode !== "preview" && modeOptions.includes(lastEditMode)) {
      return lastEditMode;
    }
    if (modeOptions.includes("live-preview")) {
      return "live-preview";
    }
    if (modeOptions.includes("source")) {
      return "source";
    }
    return (
      modeOptions.find((modeOption) => modeOption !== "preview") ?? "source"
    );
  }, [lastEditMode, modeOptions]);

  useEffect(() => {
    if (mode !== "preview") {
      setLastEditMode(mode);
    }
  }, [mode]);

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
                  aria-label={toolbarItemLabels[item]}
                  className="mira-toolbar__button"
                  disabled={readonly}
                  key={item}
                  onClick={() =>
                    actionContext().insertMarkdown(templateForToolbarItem(item))
                  }
                  title={toolbarItemLabels[item]}
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

        {viewModeControlVisible || splitModeVisible ? (
          <>
            {toolbarHasStartContent || endToolbars.length > 0 ? (
              <Separator />
            ) : null}
            <div
              aria-label="View mode"
              className="mira-default-ui__toolbar-section"
              role="group"
            >
              {viewModeControlVisible ? (
                mode === "preview" ? (
                  <button
                    aria-label="Edit"
                    className="mira-toolbar__button"
                    onClick={() => applyMode(preferredEditMode())}
                    title="Edit"
                    type="button"
                  >
                    <PencilLine
                      aria-hidden="true"
                      className="mira-default-ui__icon"
                    />
                  </button>
                ) : (
                  <ViewModeDropdown
                    items={viewModeMenuItems}
                    isOpen={openMenu === "view-mode"}
                    onApplyMode={applyMode}
                    onToggle={() =>
                      setOpenMenu((current) =>
                        current === "view-mode" ? null : "view-mode",
                      )
                    }
                  />
                )
              ) : null}
              {splitModeVisible ? (
                <button
                  aria-label="Split"
                  aria-pressed={mode === "split" ? "true" : undefined}
                  className="mira-toolbar__button"
                  onClick={() => applyMode("split")}
                  title="Split"
                  type="button"
                >
                  <Columns2
                    aria-hidden="true"
                    className="mira-default-ui__icon"
                  />
                </button>
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

function ViewModeDropdown({
  isOpen,
  items,
  onApplyMode,
  onToggle,
}: {
  isOpen: boolean;
  items: ViewModeMenuItem[];
  onApplyMode: (mode: MiraMode) => void;
  onToggle: () => void;
}): React.ReactElement {
  return (
    <div className="mira-react-dropdown">
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="View mode"
        className="mira-toolbar__button"
        onClick={onToggle}
        title="View mode"
        type="button"
      >
        <BookOpen aria-hidden="true" className="mira-default-ui__icon" />
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

function resolveViewModeMenuItems(
  mode: MiraMode,
  modeOptions: MiraMode[],
): ViewModeMenuItem[] {
  const itemModes: MiraMode[] = [];

  if (mode !== "live-preview" && modeOptions.includes("live-preview")) {
    itemModes.push("live-preview");
  }
  if (modeOptions.includes("source")) {
    itemModes.push("source");
  }
  if (modeOptions.includes("preview")) {
    itemModes.push("preview");
  }

  return itemModes.map((modeOption) => ({
    checked: mode === modeOption,
    icon: modeIcons[modeOption],
    label: modeLabels[modeOption],
    mode: modeOption,
  }));
}

function templateForToolbarItem(item: MiraDefaultToolbarItem): string {
  switch (item) {
    case "heading":
      return "# Heading";
    case "bold":
      return "**strong**";
    case "italic":
      return "_emphasis_";
    case "quote":
      return "> Quote";
    case "bulletList":
      return "- List item";
    case "taskList":
      return "- [ ] Task";
    case "link":
      return "[label](https://example.com)";
    case "table":
      return "\n| Column | Value |\n| --- | --- |\n| Item | Detail |\n";
    case "gridTable":
      return "\n+--------+--------+\n| Column | Value  |\n+========+========+\n| Item   | Detail |\n+--------+--------+\n";
    case "code":
      return '\n```ts\nconsole.log("hello");\n```\n';
    case "math":
      return "$E = mc^2$";
    case "mermaid":
      return "\n```mermaid\nflowchart TD\n  A[Start] --> B[Done]\n```\n";
  }
}
