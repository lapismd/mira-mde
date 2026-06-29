import {
  pickedCompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
  type CompletionSource,
} from "@codemirror/autocomplete";
import {
  EditorState,
  type Extension,
  type TransactionSpec,
} from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

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

export type MiraSlashCommandOptions = {
  commands?: readonly MiraSlashCommand[];
  enabled?: boolean;
};

type SlashMatch = {
  from: number;
  to: number;
  query: string;
};

export function createSlashCommandExtensions(
  options: MiraSlashCommandOptions = {},
): Extension[] {
  if (options.enabled === false || !options.commands?.length) {
    return [];
  }

  const source = createSlashCommandCompletionSource(options.commands);

  return [
    EditorState.languageData.of(() => [
      {
        autocomplete: source,
      },
    ]),
  ];
}

export function createSlashCommandCompletionSource(
  commands: readonly MiraSlashCommand[],
): CompletionSource {
  return (context: CompletionContext): CompletionResult | null => {
    const match = matchSlashCommand(context);
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

function matchSlashCommand(context: CompletionContext): SlashMatch | null {
  const line = context.state.doc.lineAt(context.pos);
  const beforeCursor = context.state.doc.sliceString(line.from, context.pos);
  const match = /(^|\s)\/([^\s/]*)$/u.exec(beforeCursor);

  if (!match) {
    return null;
  }

  const slashOffset = match.index + (match[1]?.length ?? 0);
  return {
    from: line.from + slashOffset,
    to: context.pos,
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
