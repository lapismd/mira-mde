import { syntaxTree } from "@codemirror/language";
import {
  StateField,
  type EditorState,
  type Extension,
  type Range,
} from "@codemirror/state";
import {
  Decoration,
  EditorView,
  WidgetType,
  type DecorationSet,
} from "@codemirror/view";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root, RootContent, Definition } from "mdast";
import type { InlineMarkdownWidget } from "../codemirror/rich/widgets/preview-widgets";
import type { MiraExtension, MiraExtensionContext } from "../../extensions";
import { inlineLinksExtension } from "../../extensions/inline-links";
import { parseInlineLinkUrl, type MiraLinkIconRegistry } from "./registry";

const parser = unified().use(remarkParse).use(remarkGfm);

// Keep the bundled extension entry point independent of eager preview evaluation.
// The existing widget owns source selection, formatting and mount teardown.
class LinkPreviewWidget extends WidgetType {
  private mounts = new Map<
    HTMLElement,
    { disposed: boolean; widget?: InlineMarkdownWidget; dom?: HTMLElement }
  >();
  constructor(
    private config: ConstructorParameters<typeof InlineMarkdownWidget>[0],
  ) {
    super();
  }
  override eq(other: LinkPreviewWidget) {
    return (
      this.config.from === other.config.from &&
      this.config.to === other.config.to &&
      this.config.markdown === other.config.markdown &&
      this.config.options.extensions === other.config.options.extensions
    );
  }
  override toDOM(view: EditorView) {
    const root = view.dom.ownerDocument.createElement("span");
    root.textContent = this.config.markdown;
    const state: {
      disposed: boolean;
      widget?: InlineMarkdownWidget;
      dom?: HTMLElement;
    } = { disposed: false };
    this.mounts.set(root, state);
    void import("../codemirror/rich/widgets/preview-widgets").then(
      ({ InlineMarkdownWidget }) => {
        if (state.disposed) return;
        state.widget = new InlineMarkdownWidget(this.config);
        state.dom = state.widget.toDOM(view);
        root.replaceChildren(state.dom);
      },
    );
    return root;
  }
  override destroy(root: HTMLElement) {
    const state = this.mounts.get(root);
    if (state) {
      state.disposed = true;
      if (state.dom) state.widget?.destroy(state.dom);
    }
    this.mounts.delete(root);
  }
  override ignoreEvent() {
    return true;
  }
}

export function inlineLinkLivePreview(
  registry: MiraLinkIconRegistry,
  context: MiraExtensionContext,
): Extension {
  const extensions: MiraExtension[] = context.extensions
    ? [...context.extensions]
    : [inlineLinksExtension({ registry })];
  const readonly = context.readonly;
  return StateField.define<{ tree: Root; decorations: DecorationSet }>({
    create(state) {
      const tree = parser.parse(state.doc.toString());
      return { tree, decorations: build(state, tree) };
    },
    update(value, transaction) {
      if (!transaction.docChanged && !transaction.selection) return value;
      const tree = transaction.docChanged
        ? parser.parse(transaction.state.doc.toString())
        : value.tree;
      return { tree, decorations: build(transaction.state, tree) };
    },
    provide: (field) =>
      EditorView.decorations.from(field, (value) => value.decorations),
  });

  function build(state: EditorState, tree: Root): DecorationSet {
    const ranges: Range<Decoration>[] = [];
    const definitions = new Map<string, Definition>();
    function collect(node: Root | RootContent) {
      if (node.type === "definition")
        definitions.set(node.identifier.toUpperCase(), node);
      if ("children" in node)
        for (const child of node.children) collect(child as RootContent);
    }
    collect(tree);
    function walk(node: Root | RootContent) {
      // Delegate nested rendered blocks to Mira's existing preview widgets.
      if (
        [
          "blockquote",
          "table",
          "html",
          "code",
          "inlineCode",
          "image",
          "imageReference",
        ].includes(node.type)
      )
        return;
      if (node.type === "link" || node.type === "linkReference") {
        const from = node.position?.start.offset;
        const to = node.position?.end.offset;
        const definition =
          node.type === "linkReference"
            ? definitions.get(node.identifier.toUpperCase())
            : undefined;
        const href = node.type === "link" ? node.url : definition?.url;
        if (
          from === undefined ||
          to === undefined ||
          !href ||
          !parseInlineLinkUrl(href)
        )
          return;
        if (
          state.selection.ranges.some(
            (range) => range.from <= to && range.to >= from,
          )
        )
          return;
        for (
          let parent = syntaxTree(state).resolveInner(from, 1);
          parent;
          parent = parent.parent!
        ) {
          if (parent.name === "GridTable") return;
        }
        let markdown = state.sliceDoc(from, to);
        if (definition?.position)
          markdown +=
            "\n\n" +
            state.sliceDoc(
              definition.position.start.offset!,
              definition.position.end.offset!,
            );
        ranges.push(
          Decoration.replace({
            widget: new LinkPreviewWidget({
              from,
              to,
              markdown,
              options: { extensions, readonly, sourcePath: context.sourcePath },
            }),
          }).range(from, to),
        );
        return;
      }
      if ("children" in node)
        for (const child of node.children) walk(child as RootContent);
    }
    walk(tree);
    return Decoration.set(ranges, true);
  }
}
