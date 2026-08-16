<script lang="ts">
  // @ts-nocheck
  import type * as Mdast from "mdast";
  import { TableNode } from "./table-node";
  import { EditorView } from "@codemirror/view";
  import { EditorState } from "@codemirror/state";
  import { cn } from "./utils";
  import { tick } from "svelte";
  import { toHtml } from "./utils";
  import { createInlineTableMarkdownExtensions } from "./inline-editor-extensions";

  let {
    node,
    onContentChange,
    onEdit = () => {},
    readonly = false,
    class: className,
  }: {
    node: Mdast.Nodes;
    class?: string;
    onContentChange: (value: string) => void;
    onEdit?: (evt: MouseEvent) => void;
    readonly?: boolean;
  } = $props();
  let content = $derived(TableNode.toMarkdown(node).trim());
  let view: EditorView = new EditorView({
    doc: "",
    state: EditorState.create({
      extensions: [
        createInlineTableMarkdownExtensions(),
        EditorView.domEventHandlers({
          focus: (event, view) => {},
          blur: (event, view) => {
            editing = false;
            const value = view.state.doc.toString();
            if (value !== content) {
              onContentChange(value);
            }
          },
        }),
      ],
    }),
  });

  let editing: boolean = $state(false);

  const codeMirror = (node: HTMLDivElement, content: string) => {
    node.append(view.dom);
    view.dispatch({
      changes: {
        insert: content.trim(),
        from: 0,
        to: view.state.doc.length,
      },
    });
    view.focus();

    return {
      update(value: string) {
        view.dispatch({
          changes: {
            insert: value.trim(),
            from: 0,
            to: view.state.doc.length,
          },
        });
      },
      destroy() {},
    };
  };

  function enableEdit(evt: MouseEvent | FocusEvent) {
    if (readonly) {
      return;
    }
    editing = true;
    if (evt instanceof MouseEvent) {
      onEdit(evt);
    }
    tick().then(() => {
      setTimeout(() => {
        view.focus();
        const pos =
          evt instanceof MouseEvent
            ? (view.posAtCoords({ x: evt.clientX, y: evt.clientY }) ?? 0)
            : view.state.doc.length;
        view.dispatch({ selection: { anchor: pos, head: pos } });
      });
    });
  }
</script>

<div class={cn("table-cell-wrapper h-full w-full", className)}>
  {#if readonly}
    <div class={cn("h-full w-full p-2", className)}>
      <div class="cm-editor cm-focused mod-inline">
        <div class="cm-scroller">
          <div class="cm-content">
            {#if content}
              {#await toHtml(content) then markup}
                {@html markup}
              {/await}
            {:else}
              &NonBreakingSpace;
            {/if}
          </div>
        </div>
      </div>
    </div>
  {:else if editing}
    <div use:codeMirror={content} class={cn("p-2", className)}></div>
  {:else}
    <div class={cn("relative h-full w-full p-2", className)}>
      <div class="cm-editor cm-focused mod-inline">
        <div class="cm-scroller">
          <div class="cm-content">
            {#if content}
              {#await toHtml(content) then markup}
                {@html markup}
              {/await}
            {:else}
              &NonBreakingSpace;
            {/if}
          </div>
        </div>
      </div>
      <button
        type="button"
        aria-label="Edit table cell"
        onclick={(evt) => enableEdit(evt)}
        onfocus={(evt) => enableEdit(evt)}
        style="position: absolute; inset: 0; opacity: 0;"
      ></button>
    </div>
  {/if}
</div>
