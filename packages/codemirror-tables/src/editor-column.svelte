<script lang="ts">
  // @ts-nocheck
  import type * as Mdast from "mdast";
  import { TableNode } from "./table-node";
  import { EditorView, drawSelection } from "@codemirror/view";
  import { EditorState } from "@codemirror/state";
  import { history } from "@codemirror/commands";
  import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
  import { cn } from "./utils";
  import { tick } from "svelte";
  import { toHtml } from "./utils";

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
        drawSelection(),
        EditorView.lineWrapping,
        history(),
        EditorView.editable.of(true),
        EditorView.editorAttributes.of({ class: "mod-inline" }),
        markdown({
          base: markdownLanguage,
        }),
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

  function enableEdit(evt: MouseEvent) {
    if (readonly) {
      return;
    }
    editing = true;
    onEdit(evt);
    tick().then(() => {
      setTimeout(() => {
        view.focus();
        const pos = view.posAtCoords({ x: evt.clientX, y: evt.clientY }) ?? 0;
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
    <div use:codeMirror={content} class="p-2"></div>
  {:else}
    <button
      onclick={(evt) => enableEdit(evt)}
      onfocus={(evt) => (editing = true)}
      class={cn("h-full w-full p-2", className)}
    >
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
    </button>
  {/if}
</div>
