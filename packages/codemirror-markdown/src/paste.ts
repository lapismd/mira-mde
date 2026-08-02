import remarkGridTable from "@adobe/remark-gridtables";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type { MiraSmartPasteConfig } from "@mira-mde/extensions";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkGfm from "remark-gfm";
import remarkStringify from "remark-stringify";
import { unified } from "unified";

export async function convertHtmlToMarkdown(html: string): Promise<string> {
  const file = await unified()
    .use(rehypeParse)
    .use(rehypeRemark)
    .use(remarkGfm)
    .use(remarkGridTable)
    .use(remarkStringify)
    .process(html);
  return String(file);
}

export function createMarkdownSmartPasteExtension(
  config: boolean | MiraSmartPasteConfig = {},
): Extension {
  const resolved = resolveSmartPasteConfig(config);
  if (!resolved.enabled) {
    return [];
  }

  return EditorView.domEventHandlers({
    paste(event, view) {
      if (clipboardHasImageFile(event.clipboardData)) {
        return false;
      }

      const html = event.clipboardData?.getData("text/html") ?? "";
      const plainText = event.clipboardData?.getData("text/plain") ?? "";
      if (resolved.html && html) {
        event.preventDefault();
        const selection = view.state.selection.main;
        void Promise.resolve(
          (resolved.convertHtml ?? convertHtmlToMarkdown)(html),
        )
          .then((markdown) => {
            replaceSelection(view, markdown, selection.from, selection.to);
          })
          .catch((error: unknown) => {
            resolved.onError?.(error);
            if (plainText) {
              replaceSelection(view, plainText, selection.from, selection.to);
            }
          });
        return true;
      }

      if (
        resolved.urlOverSelection &&
        /^https?:\/\/\S+$/u.test(plainText.trim())
      ) {
        const selection = view.state.selection.main;
        const selectedText = view.state.doc.sliceString(
          selection.from,
          selection.to,
        );
        if (selectedText) {
          event.preventDefault();
          replaceSelection(
            view,
            `[${selectedText}](${plainText.trim()})`,
            selection.from,
            selection.to,
          );
          return true;
        }
      }

      return false;
    },
  });
}

function resolveSmartPasteConfig(
  config: boolean | MiraSmartPasteConfig,
): Required<
  Pick<MiraSmartPasteConfig, "enabled" | "html" | "urlOverSelection">
> &
  MiraSmartPasteConfig {
  if (config === false) {
    return { enabled: false, html: false, urlOverSelection: false };
  }
  const resolved = typeof config === "object" ? config : {};
  return {
    enabled: resolved.enabled ?? true,
    html: resolved.html ?? true,
    urlOverSelection: resolved.urlOverSelection ?? true,
    ...resolved,
  };
}

function clipboardHasImageFile(clipboard: DataTransfer | null): boolean {
  return Array.from(clipboard?.items ?? []).some(
    (item) => item.kind === "file" && item.type.startsWith("image/"),
  );
}

function replaceSelection(
  view: EditorView,
  insert: string,
  from: number,
  to: number,
): void {
  const safeFrom = Math.min(from, view.state.doc.length);
  const safeTo = Math.min(Math.max(safeFrom, to), view.state.doc.length);
  view.dispatch({
    changes: { from: safeFrom, insert, to: safeTo },
    selection: { anchor: safeFrom + insert.length },
    scrollIntoView: true,
    userEvent: "input.paste",
  });
  view.focus();
}
