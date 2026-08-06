import { ensureSyntaxTree, syntaxTree } from "@codemirror/language";
import { Annotation, type EditorState } from "@codemirror/state";

export const MIRA_DOODLE_DIVIDER_COMMENT_PREFIX = "<!-- mira-divider:v1:";
export const MIRA_DOODLE_DIVIDER_COMMENT_SUFFIX = " -->";

const DOODLE_DIVIDER_COMMENT_PATTERN =
  /^([\t ]*(?:>[\t ]*)*)<!-- mira-divider:v1:([0-9a-f]{8}) -->[\t ]*$/u;
const DOODLE_DIVIDER_COMMENT_VALUE_PATTERN =
  /^ mira-divider:v1:([0-9a-f]{8}) $/u;

export type MiraDoodleDividerPair = {
  from: number;
  to: number;
  prefix: string;
  seed: number;
  seedFrom: number;
  seedTo: number;
  commentLine: number;
  ruleLine: number;
  ruleFrom: number;
  ruleTo: number;
};

export type MiraDoodleDividerRule = {
  from: number;
  to: number;
  line: number;
  lineFrom: number;
  lineTo: number;
  prefix: string;
  pair: MiraDoodleDividerPair | null;
};

/** New-document range for the block created by the duplicate command. */
export const miraDuplicatedBlockRange = Annotation.define<{
  from: number;
  to: number;
}>();

export function formatMiraDoodleDividerSeed(seed: number): string {
  return (seed >>> 0).toString(16).padStart(8, "0");
}

export function formatMiraDoodleDividerComment(
  seed: number,
  prefix = "",
): string {
  return `${prefix}${MIRA_DOODLE_DIVIDER_COMMENT_PREFIX}${formatMiraDoodleDividerSeed(seed)}${MIRA_DOODLE_DIVIDER_COMMENT_SUFFIX}`;
}

export function parseMiraDoodleDividerCommentLine(
  value: string,
): { prefix: string; seed: number; seedIndex: number } | null {
  const match = value.match(DOODLE_DIVIDER_COMMENT_PATTERN);
  if (!match?.[2]) {
    return null;
  }

  const prefix = match[1] ?? "";
  return {
    prefix,
    seed: Number.parseInt(match[2], 16) >>> 0,
    seedIndex: prefix.length + MIRA_DOODLE_DIVIDER_COMMENT_PREFIX.length,
  };
}

export function parseMiraDoodleDividerCommentValue(
  value: string,
): number | null {
  const match = value.match(DOODLE_DIVIDER_COMMENT_VALUE_PATTERN);
  return match?.[1] ? Number.parseInt(match[1], 16) >>> 0 : null;
}

export function collectMiraDoodleDividerRules(
  state: EditorState,
  ranges?: readonly { from: number; to: number }[],
): MiraDoodleDividerRule[] {
  const rules: MiraDoodleDividerRule[] = [];
  const tree =
    ensureSyntaxTree(state, state.doc.length, 100) ?? syntaxTree(state);

  tree.iterate({
    enter(node) {
      if (node.name !== "HorizontalRule") {
        return;
      }

      const line = state.doc.lineAt(node.from);
      if (
        ranges &&
        !ranges.some((range) => line.from <= range.to && line.to >= range.from)
      ) {
        return;
      }

      const prefix = state.doc.sliceString(line.from, node.from);
      rules.push({
        from: node.from,
        to: node.to,
        line: line.number,
        lineFrom: line.from,
        lineTo: line.to,
        prefix,
        pair: resolveMiraDoodleDividerPair(state, node.from, node.to, prefix),
      });
    },
  });

  return rules;
}

export function resolveMiraDoodleDividerPair(
  state: EditorState,
  ruleFrom: number,
  ruleTo: number,
  prefix = state.doc.sliceString(state.doc.lineAt(ruleFrom).from, ruleFrom),
): MiraDoodleDividerPair | null {
  const ruleLine = state.doc.lineAt(ruleFrom);
  if (ruleLine.number <= 1) {
    return null;
  }

  const commentLine = state.doc.line(ruleLine.number - 1);
  const parsed = parseMiraDoodleDividerCommentLine(commentLine.text);
  if (!parsed || parsed.prefix !== prefix) {
    return null;
  }

  const seedFrom = commentLine.from + parsed.seedIndex;
  return {
    from: commentLine.from,
    to: ruleLine.to,
    prefix,
    seed: parsed.seed,
    seedFrom,
    seedTo: seedFrom + 8,
    commentLine: commentLine.number,
    ruleLine: ruleLine.number,
    ruleFrom,
    ruleTo,
  };
}

export function isMiraDoodleDividerLinePair(
  commentLine: string,
  ruleLine: string,
): boolean {
  const parsed = parseMiraDoodleDividerCommentLine(commentLine);
  if (!parsed) {
    return false;
  }

  const thematicBreak = ruleLine.match(
    /^([\t ]*(?:>[\t ]*)*)(?:(?:[-*_])[\t ]*){3,}$/u,
  );
  return Boolean(thematicBreak && thematicBreak[1] === parsed.prefix);
}
