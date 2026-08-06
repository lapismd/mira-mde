import {
  EditorSelection,
  Transaction,
  type ChangeSpec,
} from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import {
  miraBlockToolbarItemIds,
  type MiraBlockControlsOptions,
  type MiraBlockToolbarConfig,
  type MiraBlockToolbarItemId,
  type MiraMarkdownBlockHandle,
  type MiraToolbarIconName,
} from "@lapismd/mira/extensions";

export const defaultMiraBlockToolbarItems = [
  "task",
  "paragraph",
  "heading1",
  "heading2",
  "heading3",
  "divider",
  "bulletList",
  "numberedList",
  "quote",
  "image",
] as const satisfies readonly MiraBlockToolbarItemId[];

export type ResolvedMiraBlockToolbarConfig = {
  ariaLabel: string;
  items: readonly MiraBlockToolbarItemId[];
};

export type ResolvedMiraBlockControlsOptions = {
  enabled: boolean;
  toolbar: ResolvedMiraBlockToolbarConfig | null;
};

export type MiraBlockPresentationIcon =
  | MiraBlockToolbarItemId
  | MiraToolbarIconName
  | "code"
  | "directive"
  | "frontmatter"
  | "generic"
  | "gridTable"
  | "heading"
  | "html"
  | "math"
  | "table";

export type MiraBlockPresentation = {
  icon: MiraBlockPresentationIcon;
  label: string;
  type: MiraBlockToolbarItemId | null;
};

type StructuralType = Exclude<MiraBlockToolbarItemId, "divider" | "image">;

type ParsedLine = {
  content: string;
  indentation: string;
  marker: string;
  markerType: StructuralType | null;
  quotes: string[];
};

const toolbarItemSet = new Set<string>(miraBlockToolbarItemIds);
const unsafeBlockKinds = new Set([
  "code",
  "directive",
  "embed",
  "frontmatter",
  "grid-table",
  "html",
  "math",
  "table",
]);

export function resolveMiraBlockControlsOptions(
  value: boolean | MiraBlockControlsOptions | undefined,
): ResolvedMiraBlockControlsOptions {
  if (!value) {
    return { enabled: false, toolbar: null };
  }
  if (value === true) {
    return { enabled: true, toolbar: null };
  }

  return {
    enabled: value.enabled !== false,
    toolbar: resolveMiraBlockToolbarConfig(value.toolbar),
  };
}

function resolveMiraBlockToolbarConfig(
  value: boolean | MiraBlockToolbarConfig | undefined,
): ResolvedMiraBlockToolbarConfig | null {
  if (!value) {
    return null;
  }
  const config = value === true ? {} : value;
  const configured = config.items ?? defaultMiraBlockToolbarItems;
  const items = Array.from(
    new Set(
      configured.filter((item): item is MiraBlockToolbarItemId =>
        toolbarItemSet.has(item),
      ),
    ),
  );
  return {
    ariaLabel: config.ariaLabel?.trim() || "Change block type",
    items,
  };
}

export function blockPresentation(
  handle: MiraMarkdownBlockHandle,
): MiraBlockPresentation {
  if (handle.listKind) {
    return presentationForStructuralType(
      handle.listKind === "task"
        ? "task"
        : handle.listKind === "numbered"
          ? "numberedList"
          : "bulletList",
    );
  }

  if (handle.headingLevel) {
    if (handle.headingLevel <= 3) {
      return presentationForStructuralType(
        `heading${handle.headingLevel}` as StructuralType,
      );
    }
    return {
      icon: "heading",
      label: `Heading ${handle.headingLevel}`,
      type: null,
    };
  }

  if (!unsafeBlockKinds.has(handle.handleRange.kind)) {
    const parsed = parseLine(handle.handleRange.text.split("\n", 1)[0] ?? "");
    if (parsed.markerType) {
      return presentationForStructuralType(parsed.markerType);
    }
    if (parsed.quotes.length > 0) {
      return presentationForStructuralType("quote");
    }
  }

  switch (handle.handleRange.kind) {
    case "paragraph":
      return presentationForStructuralType("paragraph");
    case "thematic-break":
      return { icon: "divider", label: "Divider", type: "divider" };
    case "blockquote":
      return presentationForStructuralType("quote");
    case "code":
      return { icon: "code", label: "Code block", type: null };
    case "math":
      return { icon: "math", label: "Math block", type: null };
    case "table":
      return { icon: "table", label: "Table", type: null };
    case "grid-table":
      return { icon: "gridTable", label: "Grid table", type: null };
    case "embed":
      return { icon: "image", label: "Image or embed", type: null };
    case "frontmatter":
      return { icon: "frontmatter", label: "Frontmatter", type: null };
    case "directive":
      return { icon: "directive", label: "Directive", type: null };
    case "html":
      return { icon: "html", label: "HTML block", type: null };
    default:
      return { icon: "generic", label: "Block", type: null };
  }
}

function presentationForStructuralType(
  type: StructuralType,
): MiraBlockPresentation {
  const labels: Record<StructuralType, string> = {
    task: "Task",
    paragraph: "Paragraph",
    heading1: "Heading 1",
    heading2: "Heading 2",
    heading3: "Heading 3",
    bulletList: "Bullet list",
    numberedList: "Numbered list",
    quote: "Blockquote",
  };
  return { icon: type, label: labels[type], type };
}

export function canApplyBlockToolbarItem(
  handle: MiraMarkdownBlockHandle,
  item: MiraBlockToolbarItemId,
): boolean {
  if (item === "divider" || item === "image") {
    return true;
  }
  if (unsafeBlockKinds.has(handle.handleRange.kind)) {
    return false;
  }
  return (
    Boolean(blockPresentation(handle).type) ||
    handle.handleRange.kind === "heading"
  );
}

export function applyBlockToolbarItem(
  view: EditorView,
  handle: MiraMarkdownBlockHandle,
  item: MiraBlockToolbarItemId,
  options: { insertImage?: () => void } = {},
): boolean {
  if (!canApplyBlockToolbarItem(handle, item)) {
    return false;
  }

  if (item === "image") {
    if (!options.insertImage) {
      return false;
    }
    prepareImageInsertion(view, handle);
    options.insertImage();
    return true;
  }

  if (item === "divider") {
    if (blockPresentation(handle).type === "divider") {
      return false;
    }
    return insertDivider(view, handle);
  }

  const current = blockPresentation(handle).type;
  if (current === item) {
    return false;
  }
  const replacement = convertStructuralBlock(handle, item);
  if (replacement === null || replacement === handle.handleRange.text) {
    return false;
  }

  return dispatchBlockEdit(
    view,
    structuralChangeSpecs(
      handle.handleRange.from,
      handle.handleRange.text,
      replacement,
    ),
  );
}

function structuralChangeSpecs(
  from: number,
  source: string,
  replacement: string,
): ChangeSpec[] {
  const sourceLines = source.split("\n");
  const replacementLines = replacement.split("\n");
  if (sourceLines.length === replacementLines.length) {
    const changes: ChangeSpec[] = [];
    let offset = from;
    for (let index = 0; index < sourceLines.length; index += 1) {
      changes.push(
        ...minimalLineChanges(
          offset,
          sourceLines[index] ?? "",
          replacementLines[index] ?? "",
        ),
      );
      offset += (sourceLines[index]?.length ?? 0) + 1;
    }
    return changes;
  }

  if (
    sourceLines.length === replacementLines.length + 1 &&
    /^\s*(?:=+|-+)\s*$/u.test(sourceLines[1] ?? "")
  ) {
    return [
      ...minimalLineChanges(
        from,
        sourceLines[0] ?? "",
        replacementLines[0] ?? "",
      ),
      {
        from: from + (sourceLines[0]?.length ?? 0),
        to:
          from +
          (sourceLines[0]?.length ?? 0) +
          1 +
          (sourceLines[1]?.length ?? 0),
      },
    ];
  }

  return [{ from, to: from + source.length, insert: replacement }];
}

function minimalLineChanges(
  from: number,
  source: string,
  replacement: string,
): ChangeSpec[] {
  if (source === replacement) {
    return [];
  }
  const common = longestCommonSubstring(source, replacement);
  if (common.length === 0) {
    return [{ from, to: from + source.length, insert: replacement }];
  }

  const changes: ChangeSpec[] = [];
  const sourceCommonEnd = common.source + common.length;
  const replacementCommonEnd = common.replacement + common.length;
  if (common.source > 0 || common.replacement > 0) {
    changes.push({
      from,
      to: from + common.source,
      insert: replacement.slice(0, common.replacement),
    });
  }
  if (
    sourceCommonEnd < source.length ||
    replacementCommonEnd < replacement.length
  ) {
    changes.push({
      from: from + sourceCommonEnd,
      to: from + source.length,
      insert: replacement.slice(replacementCommonEnd),
    });
  }
  return changes;
}

function longestCommonSubstring(
  source: string,
  replacement: string,
): { length: number; replacement: number; source: number } {
  let best = { length: 0, replacement: 0, source: 0 };
  const lengths = new Array<number>(replacement.length + 1).fill(0);
  for (let sourceIndex = 1; sourceIndex <= source.length; sourceIndex += 1) {
    for (
      let replacementIndex = replacement.length;
      replacementIndex >= 1;
      replacementIndex -= 1
    ) {
      if (source[sourceIndex - 1] === replacement[replacementIndex - 1]) {
        lengths[replacementIndex] = lengths[replacementIndex - 1]! + 1;
        if (lengths[replacementIndex]! > best.length) {
          best = {
            length: lengths[replacementIndex]!,
            replacement: replacementIndex - lengths[replacementIndex]!,
            source: sourceIndex - lengths[replacementIndex]!,
          };
        }
      } else {
        lengths[replacementIndex] = 0;
      }
    }
  }
  return best;
}

function convertStructuralBlock(
  handle: MiraMarkdownBlockHandle,
  target: StructuralType,
): string | null {
  const source = handle.handleRange.text;
  const lines = source.split("\n");
  const first = parseLine(lines[0] ?? "");
  const current = blockPresentation(handle).type;

  if (current === "quote" && target === "paragraph") {
    return lines.map(removeInnermostQuote).join("\n");
  }

  const content = normalizedContent(first, source, handle);
  const quotePrefix = first.quotes.join("");
  let prefix = `${first.indentation}${quotePrefix}`;

  switch (target) {
    case "paragraph":
      break;
    case "heading1":
      prefix += "# ";
      break;
    case "heading2":
      prefix += "## ";
      break;
    case "heading3":
      prefix += "### ";
      break;
    case "task":
      prefix += "- [ ] ";
      break;
    case "bulletList":
      prefix += "- ";
      break;
    case "numberedList":
      prefix += "1. ";
      break;
    case "quote":
      prefix = `${first.indentation}${quotePrefix || "> "}`;
      break;
  }

  const converted = `${prefix}${content}`;
  if (isSetextHeading(handle)) {
    return [converted, ...lines.slice(2)].join("\n");
  }
  return [converted, ...lines.slice(1)].join("\n");
}

function normalizedContent(
  parsed: ParsedLine,
  source: string,
  handle: MiraMarkdownBlockHandle,
): string {
  let content = parsed.content;
  if (parsed.markerType?.startsWith("heading") || handle.headingLevel) {
    content = content.replace(/[\t ]+#+[\t ]*$/u, "");
  }
  if (isSetextHeading(handle)) {
    const firstLine = source.split("\n", 1)[0] ?? "";
    return parseLine(firstLine).content;
  }
  return content;
}

function isSetextHeading(handle: MiraMarkdownBlockHandle): boolean {
  const lines = handle.handleRange.text.split("\n");
  return (
    handle.handleRange.kind === "heading" &&
    lines.length > 1 &&
    /^\s*(?:=+|-+)\s*$/u.test(lines[1] ?? "")
  );
}

function removeInnermostQuote(line: string): string {
  const parsed = parseLine(line);
  if (parsed.quotes.length === 0) {
    return line;
  }
  return `${parsed.indentation}${parsed.quotes.slice(0, -1).join("")}${
    parsed.marker
  }${parsed.content}`;
}

function parseLine(line: string): ParsedLine {
  const indentation = line.match(/^[\t ]*/u)?.[0] ?? "";
  let rest = line.slice(indentation.length);
  const quotes: string[] = [];

  while (rest.startsWith(">")) {
    const quote = rest.match(/^>[\t ]?/u)?.[0] ?? ">";
    quotes.push(quote);
    rest = rest.slice(quote.length);
  }

  const task = rest.match(/^(?:[-*+]|\d+[.)])[\t ]+\[([^\]\n])\][\t ]+/u);
  if (task) {
    return {
      indentation,
      quotes,
      marker: task[0],
      markerType: "task",
      content: rest.slice(task[0].length),
    };
  }

  const heading = rest.match(/^(#{1,6})(?:[\t ]+|$)/u);
  if (heading) {
    const level = heading[1]!.length;
    return {
      indentation,
      quotes,
      marker: heading[0],
      markerType: level <= 3 ? (`heading${level}` as StructuralType) : null,
      content: rest.slice(heading[0].length),
    };
  }

  const ordered = rest.match(/^\d+[.)][\t ]+/u);
  if (ordered) {
    return {
      indentation,
      quotes,
      marker: ordered[0],
      markerType: "numberedList",
      content: rest.slice(ordered[0].length),
    };
  }

  const bullet = rest.match(/^[-*+][\t ]+/u);
  if (bullet) {
    return {
      indentation,
      quotes,
      marker: bullet[0],
      markerType: "bulletList",
      content: rest.slice(bullet[0].length),
    };
  }

  return {
    indentation,
    quotes,
    marker: "",
    markerType: null,
    content: rest,
  };
}

function insertDivider(
  view: EditorView,
  handle: MiraMarkdownBlockHandle,
): boolean {
  const source = handle.handleRange.text;
  if (
    handle.handleRange.kind === "paragraph" &&
    parseLine(source).content.trim().length === 0
  ) {
    return dispatchBlockEdit(view, {
      from: handle.handleRange.from,
      to: handle.handleRange.to,
      insert: "---",
    });
  }

  const at = handle.affectedRange.to;
  const before = view.state.sliceDoc(0, at);
  const after = view.state.sliceDoc(at);
  const beforeSeparator = before.endsWith("\n\n")
    ? ""
    : before.endsWith("\n")
      ? "\n"
      : "\n\n";
  const afterSeparator = !after
    ? "\n"
    : after.startsWith("\n\n")
      ? ""
      : after.startsWith("\n")
        ? "\n"
        : "\n\n";
  return dispatchBlockEdit(view, {
    from: at,
    insert: `${beforeSeparator}---${afterSeparator}`,
  });
}

function prepareImageInsertion(
  view: EditorView,
  handle: MiraMarkdownBlockHandle,
): void {
  const at = handle.affectedRange.to;
  const after = view.state.sliceDoc(at);
  if (after.startsWith("\n\n")) {
    view.dispatch({ selection: EditorSelection.cursor(at + 1) });
    view.focus();
    return;
  }

  const insert = after.startsWith("\n") ? "\n" : "\n\n";
  view.dispatch({
    changes: { from: at, insert },
    selection: EditorSelection.cursor(at + 1),
    annotations: Transaction.userEvent.of("input.block-type"),
  });
  view.focus();
}

function dispatchBlockEdit(view: EditorView, changes: ChangeSpec): boolean {
  const scrollTop = view.scrollDOM.scrollTop;
  const scrollLeft = view.scrollDOM.scrollLeft;
  const changeSet = view.state.changes(changes);
  const selection = view.state.selection.main;
  view.dispatch({
    changes,
    selection: EditorSelection.single(
      changeSet.mapPos(selection.anchor, 1),
      changeSet.mapPos(selection.head, 1),
    ),
    annotations: Transaction.userEvent.of("input.block-type"),
  });
  view.focus();
  view.scrollDOM.scrollTop = scrollTop;
  view.scrollDOM.scrollLeft = scrollLeft;
  return true;
}

export function createBlockToolbarIcon(
  ownerDocument: Document,
  icon: MiraBlockPresentationIcon,
): HTMLElement | SVGElement {
  const textIcons: Partial<Record<MiraBlockPresentationIcon, string>> = {
    heading1: "H1",
    heading2: "H2",
    heading3: "H3",
    heading: "H",
    paragraph: "¶",
    html: "<> ",
    math: "∑",
  };
  const text = textIcons[icon];
  if (text) {
    const span = ownerDocument.createElement("span");
    span.className = "mira-block-toolbar__icon-text";
    span.textContent = text.trimEnd();
    span.setAttribute("aria-hidden", "true");
    return span;
  }

  const paths: Record<string, readonly string[]> = {
    task: ["M20 6 9 17l-5-5"],
    bulletList: [
      "M8 6h13",
      "M8 12h13",
      "M8 18h13",
      "M3 6h.01",
      "M3 12h.01",
      "M3 18h.01",
    ],
    numberedList: [
      "M10 6h11",
      "M10 12h11",
      "M10 18h11",
      "M4 4h1v4",
      "M4 10h2l-2 3h2",
      "M4 17h2l-2 3h2",
    ],
    quote: [
      "M3 21c3 0 7-1 7-8V5c0-1-.75-2-2-2H4c-1 0-2 1-2 2v6c0 1 .75 2 2 2h2c0 4-1 6-3 8Z",
      "M15 21c3 0 7-1 7-8V5c0-1-.75-2-2-2h-4c-1 0-2 1-2 2v6c0 1 .75 2 2 2h2c0 4-1 6-3 8Z",
    ],
    divider: ["M5 12h14"],
    image: [
      "M14.5 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5Z",
      "M14 4v5h5",
      "m3 16 5-5 4 4 3-3 6 6",
      "M8.5 8.5h.01",
    ],
    code: ["m8 9-3 3 3 3", "m16 9 3 3-3 3", "m14 5-4 14"],
    table: ["M3 5h18v14H3z", "M3 10h18", "M8 5v14"],
    gridTable: ["M3 5h18v14H3z", "M3 10h18", "M3 15h18", "M9 5v14", "M15 5v14"],
    frontmatter: ["M4 4h16v16H4z", "M8 8h8", "M8 12h8", "M8 16h5"],
    directive: [
      "M8 3H5a2 2 0 0 0-2 2v3",
      "M16 3h3a2 2 0 0 1 2 2v3",
      "M8 21H5a2 2 0 0 1-2-2v-3",
      "M16 21h3a2 2 0 0 0 2-2v-3",
    ],
    command: [
      "M18 9a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12Z",
    ],
    link: [
      "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
      "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
    ],
    play: ["m5 3 14 9-14 9Z"],
    "rotate-ccw": ["M3 12a9 9 0 1 0 3-6.7L3 8", "M3 3v5h5"],
    save: ["M4 3h14l2 2v16H4Z", "M8 3v6h8V3", "M8 21v-7h8v7"],
    sparkles: [
      "m12 3-1.5 4.5L6 9l4.5 1.5L12 15l1.5-4.5L18 9l-4.5-1.5Z",
      "m19 15-.75 2.25L16 18l2.25.75L19 21l.75-2.25L22 18l-2.25-.75Z",
    ],
    "wand-sparkles": [
      "m15 4 5 5L8 21l-5-5Z",
      "m6 13 5 5",
      "M18 2v4",
      "M16 4h4",
    ],
    generic: ["M4 4h16v16H4z"],
  };
  const svg = ownerDocument.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg",
  );
  svg.classList.add("mira-block-toolbar__icon-svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  for (const pathData of paths[icon] ?? paths.generic!) {
    const path = ownerDocument.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    path.setAttribute("d", pathData);
    svg.append(path);
  }
  return svg;
}
