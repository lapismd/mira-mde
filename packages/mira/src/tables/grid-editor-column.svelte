<script lang="ts">
  // @ts-nocheck
  import { EditorView, keymap } from "@codemirror/view";
  import { EditorState } from "@codemirror/state";
  import { cn } from "./utils";
  import { tick, onDestroy } from "svelte";
  import { MarkdownPreview } from "@lapismd/mira/preview";
  import type { MiraExtension } from "../extensions";
  import { createInlineTableMarkdownExtensions } from "./inline-editor-extensions";

  let {
    content,
    extensions = [],
    onContentChange,
    onEdit = () => true,
    class: className,
  }: {
    content: string;
    extensions?: MiraExtension[];
    class?: string;
    onContentChange: (value: string) => void;
    onEdit?: (evt: MouseEvent) => boolean;
  } = $props();
  let view: EditorView = new EditorView({
    doc: "",
    state: EditorState.create({
      extensions: [
        createInlineTableMarkdownExtensions(),
        keymap.of([
          {
            key: "Enter",
            run: (view) => {
              // Insert newline and prevent event from bubbling to parent
              view.dispatch({
                changes: { from: view.state.selection.main.head, insert: "\n" },
                selection: { anchor: view.state.selection.main.head + 1 },
              });
              return true; // This prevents the event from propagating
            },
          },
        ]),
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

  let destroyed = false;
  let focusTimer: ReturnType<typeof setTimeout> | undefined;
  onDestroy(() => {
    destroyed = true;
    if (focusTimer !== undefined) clearTimeout(focusTimer);
    view.destroy();
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
    if (destroyed) return;
    const pointer =
      evt instanceof MouseEvent ? { x: evt.clientX, y: evt.clientY } : null;
    editing = evt instanceof MouseEvent ? (onEdit(evt) ?? true) : true;
    if (!editing) return;
    tick().then(() => {
      if (destroyed || !editing) return;
      if (focusTimer !== undefined) clearTimeout(focusTimer);
      focusTimer = setTimeout(() => {
        focusTimer = undefined;
        if (destroyed || !editing) return;
        view.focus();
        const pos = pointer
          ? (view.posAtCoords(pointer) ?? 0)
          : view.state.doc.length;
        view.dispatch({ selection: { anchor: pos, head: pos } });
      });
    });
  }
</script>

<div class={cn("table-cell-wrapper h-full w-full", className)}>
  {#if editing}
    <div
      use:codeMirror={content}
      class={cn(
        "h-full w-full p-2 ring-[var(--background-modifier-border-focus)] focus-within:rounded-sm focus-within:ring-2",
        className,
      )}
    ></div>
  {:else}
    <div class={cn("relative h-full w-full p-2", className)}>
      <div class="cm-editor cm-focused mod-inline">
        <div class="cm-scroller">
          <div class="cm-content">
            {#if content}
              <MarkdownPreview inline value={content} {extensions} />
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
