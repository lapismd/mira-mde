import { markdown } from "@codemirror/lang-markdown";
import { yamlFrontmatter } from "@codemirror/lang-yaml";
import type { LanguageDescription } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import type { Extension, Range } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  type PluginValue,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";
import { Table } from "@lezer/markdown";
import { GenericDirectives } from "./directives";
import { GridTable } from "./grid-table";
import { parseLatex } from "./latex";
import {
  EmbedLinkParser,
  PathLinkParser,
  TagParser,
  WikiLinkParser,
} from "./lapis-inline";

export {
  createMarkdownAuthoringExtensions,
  type MiraMarkdownAuthoringOptions,
} from "./authoring";
export {
  createMarkdownCompletionExtensions,
  createMarkdownCompletionSources,
  formatMiraInternalLink,
  type MiraMarkdownCompletionOptions,
} from "./completion";
export { createMarkdownInputHandlerExtensions } from "./input-handlers";
export {
  convertHtmlToMarkdown,
  createMarkdownSmartPasteExtension,
} from "./paste";
export { GenericDirectives } from "./directives";
export {
  EmbedLinkParser,
  PathLinkParser,
  TagParser,
  WikiLinkParser,
} from "./lapis-inline";

export type MiraMarkdownCodeMirrorOptions = {
  codeLanguages?: LanguageDescription[];
  sourceMode?: boolean;
};

const wikiLinkMark = Decoration.mark({
  class: "cm-internal-link cm-wikilink",
});
const embedMark = Decoration.mark({
  class: "cm-internal-link cm-embed-link",
});
const tagMark = Decoration.mark({ class: "cm-hashtag" });
const frontmatterMark = Decoration.line({ class: "cm-hmd-frontmatter" });

export function createMarkdownCodeMirrorExtensions(
  options: MiraMarkdownCodeMirrorOptions = {},
): Extension[] {
  return [
    yamlFrontmatter({
      content: markdown({
        codeLanguages: [...languages, ...(options.codeLanguages ?? [])],
        extensions: [
          Table,
          GridTable,
          GenericDirectives,
          EmbedLinkParser,
          WikiLinkParser,
          PathLinkParser,
          TagParser,
          parseLatex(),
        ],
      }),
    }),
    markdownSourceDecorations(),
    EditorView.editorAttributes.of({
      class: options.sourceMode
        ? "mira-mde-markdown-source markdown-source-view"
        : "mira-mde-markdown-source",
    }),
  ];
}

export function markdownSourceDecorations(): Extension {
  return ViewPlugin.fromClass(MarkdownSourceDecorations, {
    decorations: (value) => value.decorations,
  });
}

class MarkdownSourceDecorations implements PluginValue {
  decorations: DecorationSet;

  constructor(private readonly view: EditorView) {
    this.decorations = buildDecorations(view);
  }

  update(update: ViewUpdate): void {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = buildDecorations(update.view);
    }
  }
}

function buildDecorations(view: EditorView): DecorationSet {
  const ranges: Range<Decoration>[] = [];
  const frontmatter = getFrontmatterRange(view.state.doc.toString());

  for (const visibleRange of view.visibleRanges) {
    let line = view.state.doc.lineAt(visibleRange.from);
    while (line.from <= visibleRange.to) {
      if (
        frontmatter &&
        line.from >= frontmatter.from &&
        line.to <= frontmatter.to
      ) {
        ranges.push(frontmatterMark.range(line.from));
      }

      decorateInlineMarkdown(line.text, line.from, ranges);

      if (line.to >= visibleRange.to || line.number >= view.state.doc.lines) {
        break;
      }
      line = view.state.doc.line(line.number + 1);
    }
  }

  return Decoration.set(ranges, true);
}

function decorateInlineMarkdown(
  text: string,
  lineStart: number,
  ranges: Range<Decoration>[],
): void {
  for (const match of text.matchAll(/!\[\[[^\]\n]+]]/g)) {
    ranges.push(
      embedMark.range(
        lineStart + match.index,
        lineStart + match.index + match[0].length,
      ),
    );
  }

  for (const match of text.matchAll(/(?<!!)\[\[[^\]\n]+]]/g)) {
    ranges.push(
      wikiLinkMark.range(
        lineStart + match.index,
        lineStart + match.index + match[0].length,
      ),
    );
  }

  for (const match of text.matchAll(/(^|[\s([{])#[\p{L}\p{N}_/-]+/gu)) {
    const prefixLength = match[1]?.length ?? 0;
    const from = lineStart + match.index + prefixLength;
    ranges.push(tagMark.range(from, from + match[0].length - prefixLength));
  }
}

function getFrontmatterRange(doc: string): { from: number; to: number } | null {
  if (!doc.startsWith("---\n")) {
    return null;
  }

  const end = doc.indexOf("\n---", 4);
  if (end === -1) {
    return null;
  }

  return {
    from: 0,
    to: end + 4,
  };
}
