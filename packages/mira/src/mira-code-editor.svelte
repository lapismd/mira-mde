<script lang="ts">
  import "./mira-code-editor.css";
  import { Compartment, type Extension } from "@codemirror/state";
  import { EditorView, type ViewUpdate } from "@codemirror/view";
  import { onMount } from "svelte";
  import { createBaseCodeMirrorExtensions } from "@lapismd/mira/codemirror";
  import {
    createMiraEditorController,
    type MiraEditorController,
    type MiraEditorSelection,
  } from "@lapismd/mira/core";
  import type { MiraTemplateSelection } from "@lapismd/mira/extensions";
  import type { MiraCodeEditorProps } from "./mira-code-editor";

  let {
    value = $bindable(""),
    extensions = [],
    readonly = false,
    placeholder = "",
    lineWrapping = true,
    spellcheck = false,
    lineNumbers = true,
    indentWithTabs = true,
    indentWidth = 2,
    ariaLabel = "Code editor",
    invalid = false,
    minHeight = "10rem",
    scrollerTabIndex = null,
    variant = "code",
    surface = "framed",
    height = "content",
    class: className = "",
    onChange,
    onUpdate,
    onFocus,
    onBlur,
  }: MiraCodeEditorProps = $props();

  let host: HTMLDivElement;
  let controller: MiraEditorController | null = $state(null);
  const baseCompartment = new Compartment();
  const extensionsCompartment = new Compartment();

  function normalizedExtensions(): Extension[] {
    return Array.isArray(extensions) ? [...extensions] : [extensions];
  }

  function baseExtensions(): Extension[] {
    return createBaseCodeMirrorExtensions({
      readonly,
      placeholder,
      lineWrapping,
      spellcheck,
      lineNumbers,
      indentWithTabs,
      indentWidth,
      ariaLabel,
      contentAttributes: {
        "aria-invalid": invalid ? "true" : "false",
      },
    });
  }

  function updateScrollerTabIndex(view: EditorView): void {
    if (scrollerTabIndex === null) {
      view.scrollDOM.removeAttribute("tabindex");
      return;
    }
    view.scrollDOM.tabIndex = scrollerTabIndex;
  }

  export function focus(): void {
    controller?.focus();
  }

  export function getValue(): string {
    return controller?.getValue() ?? value;
  }

  export function setValue(nextValue: string): void {
    value = nextValue;
    controller?.setValue(nextValue);
  }

  export function getSelection(): MiraEditorSelection | null {
    return controller?.getSelection() ?? null;
  }

  export function setSelection(selection: MiraEditorSelection): void {
    controller?.setSelection(selection);
  }

  export function replaceSelection(
    nextValue: string,
    selection?: MiraTemplateSelection,
  ): void {
    controller?.replaceSelection(nextValue, selection);
  }

  export function getView(): EditorView | null {
    return controller?.view ?? null;
  }

  onMount(() => {
    const activeController = createMiraEditorController({
      value,
      codeMirrorExtensions: [
        baseCompartment.of(baseExtensions()),
        extensionsCompartment.of(normalizedExtensions()),
        EditorView.updateListener.of((update: ViewUpdate) =>
          onUpdate?.(update),
        ),
        EditorView.domEventHandlers({
          focus: (event, view) => {
            onFocus?.(event, view);
            return false;
          },
          blur: (event, view) => {
            onBlur?.(event, view);
            return false;
          },
        }),
      ],
      onChange(nextValue) {
        value = nextValue;
        onChange?.(nextValue);
      },
    });

    activeController.mount(host);
    controller = activeController;
    updateScrollerTabIndex(activeController.view);

    return () => {
      activeController.destroy();
      if (controller === activeController) controller = null;
    };
  });

  $effect(() => {
    if (controller && value !== controller.getValue()) {
      controller.setValue(value);
    }
  });

  $effect(() => {
    readonly;
    placeholder;
    lineWrapping;
    spellcheck;
    lineNumbers;
    indentWithTabs;
    indentWidth;
    ariaLabel;
    invalid;
    extensions;
    if (!controller) return;
    controller.view.dispatch({
      effects: [
        baseCompartment.reconfigure(baseExtensions()),
        extensionsCompartment.reconfigure(normalizedExtensions()),
      ],
    });
  });

  $effect(() => {
    scrollerTabIndex;
    if (controller) updateScrollerTabIndex(controller.view);
  });
</script>

<div
  class={`mira-code-editor ${className}`.trim()}
  data-variant={variant}
  data-surface={surface}
  data-height={height}
  data-invalid={invalid}
  style={`--mira-code-editor-min-height: ${minHeight};`}
>
  <div bind:this={host} class="mira-code-editor__host"></div>
</div>
