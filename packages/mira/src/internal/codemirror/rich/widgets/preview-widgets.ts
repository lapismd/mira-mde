import { Transaction } from "@codemirror/state";
import { EditorView, WidgetType } from "@codemirror/view";
import {
  createMarkdownGridTableWidget,
  createMarkdownTableWidget,
} from "@lapismd/mira/tables";
import { MarkdownPreview } from "@lapismd/mira/preview";
import { mount, unmount } from "svelte";
import {
  collectMiraDoodleDividerRules,
  formatMiraDoodleDividerSeed,
  MIRA_DOODLE_DIVIDER_CONTROL_EVENT,
  resolveMiraDoodleDividerController,
  type MiraDoodleDividerControlAction,
} from "../../../doodle-dividers";
import type { MiraRichEditorOptions } from "../types";
import {
  shouldActivateEditablePreview,
  PREVIEW_INTERACTIVE_SELECTOR,
} from "../utils/activation";
import { estimateMarkdownBlockHeight } from "../utils/height-estimates";
import { createSourceToggleButton, selectWidgetSource } from "./source-toggle";

const previewWidgetMounts = new WeakMap<HTMLElement, Record<string, unknown>>();
const previewWidgetObservers = new WeakMap<HTMLElement, MutationObserver>();
const frontmatterDisclosureByView = new WeakMap<
  EditorView,
  { configuredOpen: boolean; open: boolean }
>();

export class BlockPreviewWidget extends WidgetType {
  constructor(
    private readonly config: {
      from: number;
      to: number;
      markdown: string;
      markdownFrom?: number;
      markdownIndentLength?: number;
      markdownIndentedLineStarts?: number[];
      nodeName: string;
      options: MiraRichEditorOptions;
    },
  ) {
    super();
  }

  override eq(other: BlockPreviewWidget): boolean {
    return (
      this.config.from === other.config.from &&
      this.config.to === other.config.to &&
      this.config.markdown === other.config.markdown &&
      this.config.markdownFrom === other.config.markdownFrom &&
      this.config.markdownIndentLength === other.config.markdownIndentLength &&
      JSON.stringify(this.config.markdownIndentedLineStarts) ===
        JSON.stringify(other.config.markdownIndentedLineStarts) &&
      this.config.nodeName === other.config.nodeName &&
      this.config.options.frontmatterOpen ===
        other.config.options.frontmatterOpen &&
      this.config.options.readonly === other.config.options.readonly
    );
  }

  override get estimatedHeight(): number {
    return estimateMarkdownBlockHeight(this.config.markdown);
  }

  override toDOM(view: EditorView): HTMLElement {
    const container = document.createElement("div");
    container.className = [
      "mira-rich-widget",
      "mira-rich-widget--block",
      `mira-rich-widget--${this.config.nodeName.toLowerCase()}`,
      "markdown-rendered",
    ].join(" ");
    container.dataset.node = this.config.nodeName;
    if (this.config.options.readonly) {
      container.dataset.readonly = "true";
    }

    if (
      this.config.nodeName === "Table" ||
      this.config.nodeName === "GridTable"
    ) {
      const createWidget =
        this.config.nodeName === "GridTable"
          ? createMarkdownGridTableWidget
          : createMarkdownTableWidget;
      container.append(
        createWidget({
          markdown: this.config.markdown,
          onChange: (nextMarkdown) => {
            this.dispatchMarkdownReplacement(view, nextMarkdown);
          },
          onDelete: () => {
            this.dispatchMarkdownReplacement(view, "");
          },
          onSource: () => {
            selectWidgetSource(view, this.config.from, this.config.to);
          },
        }),
      );
      return container;
    }

    container.append(
      createSourceToggleButton(() => {
        selectWidgetSource(view, this.config.from, this.config.to);
      }),
    );

    let pendingFrontmatterValue = "";
    const configuredFrontmatterOpen =
      this.config.options.frontmatterOpen ?? true;
    const retainedFrontmatterDisclosure =
      this.config.nodeName === "Frontmatter"
        ? frontmatterDisclosureByView.get(view)
        : undefined;
    const frontmatterOpen =
      retainedFrontmatterDisclosure?.configuredOpen ===
      configuredFrontmatterOpen
        ? retainedFrontmatterDisclosure.open
        : configuredFrontmatterOpen;
    if (this.config.nodeName === "Frontmatter") {
      frontmatterDisclosureByView.set(view, {
        configuredOpen: configuredFrontmatterOpen,
        open: frontmatterOpen,
      });
    }
    const component = mount(MarkdownPreview, {
      target: container,
      props: {
        value: this.config.markdown,
        embed: true,
        sourcePath: this.config.options.sourcePath,
        extensions: this.config.options.extensions ?? [],
        linkResolver: this.config.options.linkResolver,
        assetResolver: this.config.options.assetResolver,
        fileAdapter: this.config.options.fileAdapter,
        frontmatterOpen,
        frontmatterConfig: this.config.options.frontmatterConfig as any,
        onChange: (replacement: string, from: number, to: number) => {
          const absoluteFrom = this.absoluteMarkdownOffset(from);
          const absoluteTo = this.absoluteMarkdownOffset(to);
          const nextValue = [
            view.state.doc.sliceString(0, absoluteFrom),
            replacement,
            view.state.doc.sliceString(absoluteTo),
          ].join("");
          pendingFrontmatterValue = nextValue;
          this.config.options.onChange?.(
            replacement,
            absoluteFrom,
            absoluteTo,
            nextValue,
          );
        },
        onFrontmatterChange: (nextYaml: string) => {
          this.config.options.onFrontmatterChange?.(
            nextYaml,
            pendingFrontmatterValue || view.state.doc.toString(),
          );
        },
      },
    });
    previewWidgetMounts.set(container, component as Record<string, unknown>);

    if (this.config.nodeName === "Frontmatter") {
      const retainDisclosure = () => {
        const expanded = container
          .querySelector<HTMLElement>(".md-frontmatter__trigger")
          ?.getAttribute("aria-expanded");
        if (expanded !== "true" && expanded !== "false") return;
        frontmatterDisclosureByView.set(view, {
          configuredOpen: configuredFrontmatterOpen,
          open: expanded === "true",
        });
      };
      retainDisclosure();
      const observer = new MutationObserver(retainDisclosure);
      observer.observe(container, {
        attributes: true,
        attributeFilter: ["aria-expanded"],
        childList: true,
        subtree: true,
      });
      previewWidgetObservers.set(container, observer);
    }

    if (this.config.nodeName === "HorizontalRule") {
      container.addEventListener(MIRA_DOODLE_DIVIDER_CONTROL_EVENT, (event) => {
        this.handleDoodleDividerControl(
          view,
          event as CustomEvent<MiraDoodleDividerControlAction>,
        );
      });
    }

    const selectSource = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const interactiveTarget = target?.closest(PREVIEW_INTERACTIVE_SELECTOR);
      if (
        interactiveTarget &&
        interactiveTarget !== container &&
        container.contains(interactiveTarget)
      ) {
        return;
      }

      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      selectWidgetSource(view, this.config.from, this.config.to);
    };

    container.addEventListener("pointerdown", selectSource, { capture: true });
    container.addEventListener("mousedown", selectSource, { capture: true });
    container.addEventListener("click", selectSource, { capture: true });

    return container;
  }

  private absoluteMarkdownOffset(offset: number): number {
    const markdownFrom = this.config.markdownFrom ?? this.config.from;
    const indentLength = this.config.markdownIndentLength ?? 0;
    const indentedLines = this.config.markdownIndentedLineStarts ?? [];
    const removedIndentCount = indentedLines.filter(
      (lineStart) => lineStart <= offset,
    ).length;
    return markdownFrom + offset + removedIndentCount * indentLength;
  }

  private dispatchMarkdownReplacement(
    view: EditorView,
    replacement: string,
  ): void {
    view.dispatch({
      changes: {
        from: this.config.from,
        to: this.config.to,
        insert: replacement,
      },
      selection: {
        anchor: this.config.from,
      },
      scrollIntoView: true,
    });
  }

  private handleDoodleDividerControl(
    view: EditorView,
    event: CustomEvent<MiraDoodleDividerControlAction>,
  ): void {
    const controller = resolveMiraDoodleDividerController(
      this.config.options.extensions,
    );
    const rule = collectMiraDoodleDividerRules(view.state, [
      { from: this.config.from, to: this.config.to },
    ]).find(
      (candidate) =>
        candidate.pair?.from === this.config.from &&
        candidate.pair.to === this.config.to,
    );
    if (!controller || !rule?.pair) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const context = {
      sourcePath: this.config.options.sourcePath,
      line: rule.line,
      offset: rule.from,
    };
    const nextSeed =
      event.detail.action === "reroll"
        ? controller.rerollSeed(rule.pair.seed, context)
        : controller.selectVariantSeed(
            rule.pair.seed,
            event.detail.variantId,
            context,
          );
    if (nextSeed === null || nextSeed === rule.pair.seed) {
      return;
    }

    const scrollTop = view.scrollDOM.scrollTop;
    const scrollLeft = view.scrollDOM.scrollLeft;
    view.dispatch({
      changes: {
        from: rule.pair.seedFrom,
        to: rule.pair.seedTo,
        insert: formatMiraDoodleDividerSeed(nextSeed),
      },
      annotations: Transaction.userEvent.of(
        event.detail.action === "reroll"
          ? "input.doodle-divider.reroll"
          : "input.doodle-divider.variant",
      ),
    });
    view.focus();
    view.scrollDOM.scrollTop = scrollTop;
    view.scrollDOM.scrollLeft = scrollLeft;
  }

  override destroy(dom: HTMLElement): void {
    previewWidgetObservers.get(dom)?.disconnect();
    previewWidgetObservers.delete(dom);
    const component = previewWidgetMounts.get(dom);
    if (component) {
      void unmount(component);
      previewWidgetMounts.delete(dom);
    }
  }

  override ignoreEvent(): boolean {
    return true;
  }
}

export class InlineMarkdownWidget extends WidgetType {
  constructor(
    private readonly config: {
      from: number;
      to: number;
      markdown: string;
      options: MiraRichEditorOptions;
    },
  ) {
    super();
  }

  override eq(other: InlineMarkdownWidget): boolean {
    return (
      this.config.from === other.config.from &&
      this.config.to === other.config.to &&
      this.config.markdown === other.config.markdown
    );
  }

  override toDOM(view: EditorView): HTMLElement {
    const container = document.createElement("span");
    container.className = "mira-inline-markdown-widget markdown-rendered";

    const component = mount(MarkdownPreview, {
      target: container,
      props: {
        value: this.config.markdown,
        inline: true,
        embed: true,
        sourcePath: this.config.options.sourcePath,
        extensions: this.config.options.extensions ?? [],
        linkResolver: this.config.options.linkResolver,
        assetResolver: this.config.options.assetResolver,
        fileAdapter: this.config.options.fileAdapter,
        highlight: false,
      },
    });
    previewWidgetMounts.set(container, component as Record<string, unknown>);

    const selectSource = (event: MouseEvent) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      view.dispatch({
        selection: { anchor: this.config.from, head: this.config.to },
        scrollIntoView: true,
      });
      view.focus();
    };

    container.addEventListener("pointerdown", selectSource, { capture: true });
    container.addEventListener("mousedown", selectSource, { capture: true });
    container.addEventListener("click", selectSource, { capture: true });

    return container;
  }

  override destroy(dom: HTMLElement): void {
    const component = previewWidgetMounts.get(dom);
    if (component) {
      void unmount(component);
      previewWidgetMounts.delete(dom);
    }
  }

  override ignoreEvent(): boolean {
    return true;
  }
}

export class InlineMathWidget extends WidgetType {
  constructor(
    private readonly config: {
      from: number;
      to: number;
      source: string;
      options: MiraRichEditorOptions;
    },
  ) {
    super();
  }

  override eq(other: InlineMathWidget): boolean {
    return (
      this.config.from === other.config.from &&
      this.config.to === other.config.to &&
      this.config.source === other.config.source
    );
  }

  override toDOM(view: EditorView): HTMLElement {
    const container = document.createElement("span");
    container.className = "mira-inline-math-widget cm-inline-math";
    container.dataset.math = "inline";

    const component = mount(MarkdownPreview, {
      target: container,
      props: {
        value: this.config.source,
        inline: true,
        sourcePath: this.config.options.sourcePath,
        extensions: this.config.options.extensions ?? [],
        linkResolver: this.config.options.linkResolver,
        assetResolver: this.config.options.assetResolver,
        fileAdapter: this.config.options.fileAdapter,
      },
    });
    previewWidgetMounts.set(container, component as Record<string, unknown>);

    const selectSource = (event: MouseEvent) => {
      if (!shouldActivateEditablePreview(event)) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      view.dispatch({
        selection: { anchor: this.config.from, head: this.config.to },
        scrollIntoView: true,
      });
      view.focus();
    };

    container.addEventListener("pointerdown", selectSource, { capture: true });
    container.addEventListener("mousedown", selectSource, { capture: true });
    container.addEventListener("click", selectSource, { capture: true });

    return container;
  }

  override destroy(dom: HTMLElement): void {
    const component = previewWidgetMounts.get(dom);
    if (component) {
      void unmount(component);
      previewWidgetMounts.delete(dom);
    }
  }

  override ignoreEvent(): boolean {
    return true;
  }
}
