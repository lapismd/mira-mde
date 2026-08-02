import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type { MiraMarkdownInputHandlerConfig } from "@lapismd/mira/extensions";

export function createMarkdownInputHandlerExtensions(
  config: boolean | MiraMarkdownInputHandlerConfig = {},
): Extension[] {
  if (
    config === false ||
    (typeof config === "object" && config.enabled === false)
  ) {
    return [];
  }

  const resolved =
    typeof config === "object"
      ? config
      : ({} as MiraMarkdownInputHandlerConfig);
  const codeFence = resolved.codeFence ?? true;
  const frontmatter = resolved.frontmatter ?? true;
  const ellipsis = resolved.ellipsis ?? false;

  return [
    EditorView.inputHandler.of((view, from, to, text) => {
      const line = view.state.doc.lineAt(from);

      if (codeFence && text === "`" && from === line.to && line.text === "``") {
        view.dispatch({
          changes: { from: line.from, insert: "```\n```", to },
          selection: { anchor: line.from + 3 },
          userEvent: "input.type",
        });
        return true;
      }

      if (
        frontmatter &&
        ((text === "-" && from === 2 && view.state.sliceDoc(0, 2) === "--") ||
          (text === "-" && from === 1 && view.state.sliceDoc(0, 1) === "—"))
      ) {
        view.dispatch({
          changes: { from: 0, insert: "---\n\n---", to },
          selection: { anchor: 4 },
          userEvent: "input.type",
        });
        return true;
      }

      if (
        ellipsis &&
        text === "." &&
        from >= 2 &&
        view.state.sliceDoc(from - 2, from) === ".."
      ) {
        view.dispatch({
          changes: { from: from - 2, insert: "…", to },
          selection: { anchor: from - 1 },
          userEvent: "input.type",
        });
        return true;
      }

      if (ellipsis && text === "...") {
        view.dispatch({
          changes: { from, insert: "…", to },
          selection: { anchor: from + 1 },
          userEvent: "input.type",
        });
        return true;
      }

      return false;
    }),
  ];
}
