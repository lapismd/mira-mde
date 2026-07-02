import {
  pickedCompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
  type CompletionSource,
} from "@codemirror/autocomplete";
import {
  EditorState,
  Prec,
  type Extension,
  StateEffect,
  type StateEffectType,
  StateField,
  type TransactionSpec,
} from "@codemirror/state";
import {
  EditorView,
  keymap,
  showTooltip,
  type KeyBinding,
  type Tooltip,
  type TooltipView,
  type ViewUpdate,
} from "@codemirror/view";

export type MiraTextRange = {
  from: number;
  to: number;
};

export type MiraTemplateSelection =
  | number
  | {
      anchor: number;
      head?: number;
    };

export type MiraMarkdownTemplate = {
  markdown: string;
  selection?: MiraTemplateSelection;
};

export type MiraSlashCommandContext = {
  view?: unknown;
  query: string;
  range: MiraTextRange;
  getValue: () => string;
  setValue: (value: string) => void;
  focus: () => void;
  insertMarkdown: (markdown: string, selection?: MiraTemplateSelection) => void;
  replaceRange: (
    markdown: string,
    range?: Partial<MiraTextRange>,
    selection?: MiraTemplateSelection,
  ) => void;
};

export type MiraSlashCommand = {
  id: string;
  label: string;
  description?: string;
  group?: string;
  keywords?: string[];
  boost?: number;
  insert?: string | MiraMarkdownTemplate;
  run?: (context: MiraSlashCommandContext) => void;
};

export type MiraSlashCommandUi = "popover" | "autocomplete";

export type MiraSlashCommandTriggerScope = "line-start" | "after-whitespace";

export type MiraSlashCommandOptions = {
  commands?: readonly MiraSlashCommand[];
  enabled?: boolean;
  ui?: MiraSlashCommandUi;
  triggerScope?: MiraSlashCommandTriggerScope;
};

type SlashMatch = {
  from: number;
  to: number;
  query: string;
};

type SlashPopoverState = {
  match: SlashMatch;
  commands: readonly MiraSlashCommand[];
  selectedIndex: number;
};

export type MiraSlashSnippetOptions<TId extends string = string> = {
  id: TId;
  label: string;
  description?: string;
  group?: string;
  keywords?: string[];
  boost?: number;
  markdown: string;
  marker?: string;
};

type SlashPopoverControls = {
  close: StateEffectType<null>;
  select: StateEffectType<number>;
  field: StateField<SlashPopoverState | null>;
};

export function createSlashCommandExtensions(
  options: MiraSlashCommandOptions = {},
): Extension[] {
  if (options.enabled === false || !options.commands?.length) {
    return [];
  }

  const triggerScope = options.triggerScope ?? "line-start";

  if (options.ui === "autocomplete") {
    const source = createSlashCommandCompletionSource(options.commands, {
      triggerScope,
    });

    return [
      EditorState.languageData.of(() => [
        {
          autocomplete: source,
        },
      ]),
    ];
  }

  return createSlashCommandPopoverExtensions(options.commands, triggerScope);
}

export function createSlashCommandCompletionSource(
  commands: readonly MiraSlashCommand[],
  options: Pick<MiraSlashCommandOptions, "triggerScope"> = {},
): CompletionSource {
  const triggerScope = options.triggerScope ?? "after-whitespace";

  return (context: CompletionContext): CompletionResult | null => {
    const match = matchSlashCommand(context, triggerScope);
    if (!match) {
      return null;
    }

    const options = commands
      .filter((command) => commandMatchesQuery(command, match.query))
      .map((command) => completionForSlashCommand(command, match));

    if (options.length === 0) {
      return null;
    }

    return {
      from: match.from + 1,
      to: match.to,
      options,
      filter: false,
    };
  };
}

export function createMarkdownTemplate(
  markdown: string,
  marker = "<|>",
): MiraMarkdownTemplate {
  if (!marker) {
    return { markdown };
  }

  const selection = markdown.indexOf(marker);
  if (selection === -1) {
    return { markdown };
  }

  return {
    markdown: markdown.replace(marker, ""),
    selection,
  };
}

export function createSlashSnippet<TId extends string = string>(
  options: MiraSlashSnippetOptions<TId>,
): MiraSlashCommand & { id: TId } {
  const { markdown, marker, ...command } = options;

  return {
    ...command,
    insert: createMarkdownTemplate(markdown, marker),
  };
}

export function applyMarkdownTemplate(
  view: EditorView,
  template: string | MiraMarkdownTemplate,
  from: number,
  to: number,
  completion?: Completion,
): void {
  const normalized = normalizeMarkdownTemplate(template);
  const selection = selectionForTemplate(normalized, from);
  const transaction: TransactionSpec = {
    changes: {
      from,
      to,
      insert: normalized.markdown,
    },
    selection,
    scrollIntoView: true,
  };

  if (completion) {
    transaction.annotations = pickedCompletion.of(completion);
  }

  view.dispatch(transaction);
}

function createSlashCommandPopoverExtensions(
  commands: readonly MiraSlashCommand[],
  triggerScope: MiraSlashCommandTriggerScope,
): Extension[] {
  const close = StateEffect.define<null>();
  const select = StateEffect.define<number>();
  const field: StateField<SlashPopoverState | null> =
    StateField.define<SlashPopoverState | null>({
      create(state) {
        return resolveSlashPopoverState(state, commands, triggerScope, null);
      },
      update(value, transaction) {
        let nextSelection: number | null = null;

        for (const effect of transaction.effects) {
          if (effect.is(close)) {
            return null;
          }
          if (effect.is(select)) {
            nextSelection = effect.value;
          }
        }

        if (!transaction.docChanged && !transaction.selection) {
          if (value && nextSelection !== null) {
            return {
              ...value,
              selectedIndex: wrapIndex(nextSelection, value.commands.length),
            };
          }

          return value;
        }

        const next = resolveSlashPopoverState(
          transaction.state,
          commands,
          triggerScope,
          value,
        );

        if (!next) {
          return null;
        }

        if (nextSelection !== null) {
          return {
            ...next,
            selectedIndex: wrapIndex(nextSelection, next.commands.length),
          };
        }

        return next;
      },
      provide: (activeField) =>
        showTooltip.compute([activeField], (state) => {
          const value = state.field(activeField);

          return value
            ? slashCommandTooltip(value, { close, select, field: activeField })
            : null;
        }),
    });

  return [
    slashCommandTheme,
    field,
    Prec.highest(keymap.of(slashCommandKeymap({ close, select, field }))),
  ];
}

function resolveSlashPopoverState(
  state: EditorState,
  commands: readonly MiraSlashCommand[],
  triggerScope: MiraSlashCommandTriggerScope,
  previous: SlashPopoverState | null,
): SlashPopoverState | null {
  if (state.selection.ranges.length !== 1 || !state.selection.main.empty) {
    return null;
  }

  const match = matchSlashCommandAt(
    state,
    state.selection.main.head,
    triggerScope,
  );

  if (!match) {
    return null;
  }

  const matchingCommands = commands.filter((command) =>
    commandMatchesQuery(command, match.query),
  );

  if (matchingCommands.length === 0) {
    return null;
  }

  const selectedIndex =
    previous?.match.from === match.from && previous.match.query === match.query
      ? clampIndex(previous.selectedIndex, matchingCommands.length)
      : 0;

  return {
    match,
    commands: matchingCommands,
    selectedIndex,
  };
}

function slashCommandKeymap(controls: SlashPopoverControls): KeyBinding[] {
  return [
    {
      key: "ArrowDown",
      run(view) {
        return moveSlashSelection(view, controls, 1);
      },
    },
    {
      key: "ArrowUp",
      run(view) {
        return moveSlashSelection(view, controls, -1);
      },
    },
    {
      key: "Enter",
      run(view) {
        const state = view.state.field(controls.field, false);
        const command = state?.commands[state.selectedIndex];
        if (!state || !command) {
          return false;
        }

        applySlashCommand(view, command, state.match);
        view.dispatch({
          effects: controls.close.of(null),
        });
        return true;
      },
    },
    {
      key: "Escape",
      run(view) {
        const state = view.state.field(controls.field, false);
        if (!state) {
          return false;
        }

        view.dispatch({
          effects: controls.close.of(null),
        });
        return true;
      },
    },
  ];
}

function moveSlashSelection(
  view: EditorView,
  controls: SlashPopoverControls,
  direction: number,
): boolean {
  const state = view.state.field(controls.field, false);
  if (!state) {
    return false;
  }

  view.dispatch({
    effects: controls.select.of(state.selectedIndex + direction),
  });
  return true;
}

function slashCommandTooltip(
  value: SlashPopoverState,
  controls: SlashPopoverControls,
): Tooltip {
  return {
    pos: value.match.from,
    create(view) {
      return new SlashCommandTooltipView(view, value, controls);
    },
  };
}

class SlashCommandTooltipView implements TooltipView {
  dom = document.createElement("div");
  #view: EditorView;
  #value: SlashPopoverState;
  #controls: SlashPopoverControls;

  constructor(
    view: EditorView,
    value: SlashPopoverState,
    controls: SlashPopoverControls,
  ) {
    this.#view = view;
    this.#value = value;
    this.#controls = controls;
    this.dom.className = "mira-slash-menu";
    this.dom.setAttribute("role", "listbox");
    this.render();
  }

  update(update: ViewUpdate): void {
    const next = update.state.field(this.#controls.field, false);
    if (!next) {
      return;
    }

    this.#value = next;
    this.render();
  }

  private render(): void {
    this.dom.replaceChildren();

    const groups = groupSlashCommands(this.#value.commands);
    let index = 0;

    for (const [group, commands] of groups) {
      if (group) {
        const groupElement = document.createElement("div");
        groupElement.className = "mira-slash-menu__group";
        groupElement.textContent = group;
        this.dom.append(groupElement);
      }

      for (const command of commands) {
        const commandIndex = index;
        const button = document.createElement("button");
        const isActive = commandIndex === this.#value.selectedIndex;
        button.type = "button";
        button.tabIndex = -1;
        button.className = isActive
          ? "mira-slash-menu__item mira-slash-menu__item--active"
          : "mira-slash-menu__item";
        button.setAttribute("role", "option");
        button.setAttribute("aria-selected", isActive ? "true" : "false");
        button.onmousedown = (event) => {
          event.preventDefault();
        };
        button.onclick = () => {
          applySlashCommand(this.#view, command, this.#value.match);
          this.#view.dispatch({
            effects: this.#controls.close.of(null),
          });
        };

        const title = document.createElement("span");
        title.className = "mira-slash-menu__item-title";
        title.textContent = command.label;
        button.append(title);

        if (command.description) {
          const description = document.createElement("span");
          description.className = "mira-slash-menu__item-description";
          description.textContent = command.description;
          button.append(description);
        }

        this.dom.append(button);
        index += 1;
      }
    }

    const activeElement = this.dom.querySelector<HTMLElement>(
      ".mira-slash-menu__item--active",
    );
    activeElement?.scrollIntoView?.({ block: "nearest" });
  }
}

function groupSlashCommands(
  commands: readonly MiraSlashCommand[],
): Array<[string, MiraSlashCommand[]]> {
  const groups = new Map<string, MiraSlashCommand[]>();

  for (const command of commands) {
    const group = command.group ?? "";
    const groupCommands = groups.get(group);
    if (groupCommands) {
      groupCommands.push(command);
    } else {
      groups.set(group, [command]);
    }
  }

  return Array.from(groups);
}

function applySlashCommand(
  view: EditorView,
  command: MiraSlashCommand,
  match: SlashMatch,
): void {
  if (command.run) {
    command.run(createSlashCommandContext(view, match, match.to));
    return;
  }

  applyMarkdownTemplate(
    view,
    command.insert ?? command.label,
    match.from,
    match.to,
  );
}

function completionForSlashCommand(
  command: MiraSlashCommand,
  match: SlashMatch,
): Completion {
  return {
    label: command.label,
    detail: command.description,
    info: command.group,
    type: "keyword",
    section: command.group,
    boost: command.boost,
    apply(view, completion, _from, to) {
      if (command.run) {
        command.run(createSlashCommandContext(view, match, to));
        return;
      }

      applyMarkdownTemplate(
        view,
        command.insert ?? command.label,
        match.from,
        to,
        completion,
      );
    },
  };
}

function createSlashCommandContext(
  view: EditorView,
  match: SlashMatch,
  to: number,
): MiraSlashCommandContext {
  const defaultRange = {
    from: match.from,
    to,
  };

  return {
    view,
    query: match.query,
    range: defaultRange,
    getValue: () => view.state.doc.toString(),
    setValue(value) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: value,
        },
      });
    },
    focus: () => view.focus(),
    insertMarkdown(markdown, selection) {
      applyMarkdownTemplate(
        view,
        { markdown, selection },
        defaultRange.from,
        defaultRange.to,
      );
    },
    replaceRange(markdown, range = defaultRange, selection) {
      applyMarkdownTemplate(
        view,
        { markdown, selection },
        range.from ?? defaultRange.from,
        range.to ?? defaultRange.to,
      );
    },
  };
}

function matchSlashCommand(
  context: CompletionContext,
  triggerScope: MiraSlashCommandTriggerScope,
): SlashMatch | null {
  return matchSlashCommandAt(context.state, context.pos, triggerScope);
}

function matchSlashCommandAt(
  state: EditorState,
  pos: number,
  triggerScope: MiraSlashCommandTriggerScope,
): SlashMatch | null {
  const line = state.doc.lineAt(pos);
  const beforeCursor = state.doc.sliceString(line.from, pos);
  const match =
    triggerScope === "line-start"
      ? /^(\s*)\/([^\s/]*)$/u.exec(beforeCursor)
      : /(^|\s)\/([^\s/]*)$/u.exec(beforeCursor);

  if (!match) {
    return null;
  }

  const slashOffset = match.index + (match[1]?.length ?? 0);
  return {
    from: line.from + slashOffset,
    to: pos,
    query: match[2] ?? "",
  };
}

function commandMatchesQuery(
  command: MiraSlashCommand,
  query: string,
): boolean {
  if (!query) {
    return true;
  }

  const normalizedQuery = normalizeSearchText(query);
  return [command.label, command.description, ...(command.keywords ?? [])]
    .filter((value): value is string => typeof value === "string")
    .some((value) => normalizeSearchText(value).includes(normalizedQuery));
}

function normalizeSearchText(value: string): string {
  return value.toLowerCase().replace(/\s+/gu, " ").trim();
}

function normalizeMarkdownTemplate(
  template: string | MiraMarkdownTemplate,
): MiraMarkdownTemplate {
  return typeof template === "string" ? { markdown: template } : template;
}

function selectionForTemplate(
  template: MiraMarkdownTemplate,
  from: number,
): { anchor: number; head?: number } {
  const fallbackOffset = template.markdown.length;
  const selection = template.selection ?? fallbackOffset;

  if (typeof selection === "number") {
    const offset = from + clampOffset(selection, template.markdown);
    return { anchor: offset };
  }

  const anchor = from + clampOffset(selection.anchor, template.markdown);
  const head =
    from + clampOffset(selection.head ?? selection.anchor, template.markdown);
  return { anchor, head };
}

function clampOffset(offset: number, markdown: string): number {
  return Math.max(0, Math.min(markdown.length, offset));
}

function clampIndex(index: number, length: number): number {
  return Math.max(0, Math.min(length - 1, index));
}

function wrapIndex(index: number, length: number): number {
  return ((index % length) + length) % length;
}

const slashCommandTheme = EditorView.theme({
  ".mira-slash-menu": {
    boxSizing: "border-box",
    width: "min(18rem, calc(100vw - 24px))",
    maxHeight: "14rem",
    overflowY: "auto",
    padding: "6px",
    border: "1px solid var(--mira-border)",
    borderRadius: "var(--mira-radius)",
    boxShadow: "var(--mira-widget-shadow)",
    backgroundColor: "var(--mira-popover)",
    color: "var(--mira-popover-foreground)",
    fontFamily: "var(--mira-font-sans)",
    fontSize: "13px",
    scrollPadding: "6px",
  },
  ".mira-slash-menu__group": {
    padding: "4px 6px",
    color: "var(--mira-muted-foreground)",
    fontSize: "11px",
    fontWeight: "650",
    lineHeight: "1.2",
    textTransform: "uppercase",
  },
  ".mira-slash-menu__item": {
    display: "grid",
    width: "100%",
    gap: "2px",
    padding: "8px 10px",
    border: "0",
    borderRadius: "4px",
    appearance: "none",
    backgroundColor: "transparent",
    color: "inherit",
    font: "inherit",
    textAlign: "left",
    cursor: "pointer",
  },
  ".mira-slash-menu__item:hover, .mira-slash-menu__item--active": {
    backgroundColor: "var(--mira-accent-soft)",
  },
  ".mira-slash-menu__item-title": {
    color: "var(--mira-foreground)",
    fontSize: "13px",
    fontWeight: "600",
    lineHeight: "1.25",
  },
  ".mira-slash-menu__item-description": {
    overflow: "hidden",
    color: "var(--mira-muted-foreground)",
    fontSize: "12px",
    lineHeight: "1.25",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
});
