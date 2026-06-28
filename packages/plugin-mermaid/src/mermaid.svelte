<script lang="ts">
  import { Button, buttonVariants } from "@mira-mde/ui/button";
  import { cn } from "@mira-mde/ui";
  import { onMount, type Snippet } from "svelte";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronUp from "@lucide/svelte/icons/chevron-up";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import Refresh from "@lucide/svelte/icons/refresh-ccw";
  import ZoomIn from "@lucide/svelte/icons/zoom-in";
  import ZoomOut from "@lucide/svelte/icons/zoom-out";
  import MoveHorizontal from "@lucide/svelte/icons/move-horizontal";
  import CodeXml from "@lucide/svelte/icons/code-xml";
  import Check from "@lucide/svelte/icons/check";
  import * as Dialog from "@mira-mde/ui/dialog";
  import Self from "./mermaid.svelte";
  import { PanZoomState } from "./pan-zoom";
  import { parseMermaidSource } from "./frontmatter";
  import { mermaidRender } from "./renderer";
  import { applyMermaidSvgLayout, getMermaidSvgViewBox } from "./svg-layout";

  let {
    id,
    diagram,
    value,
    sourceOffset,
    class: className,
    ref = $bindable(null),
    panZoomState = new PanZoomState(),
    children,
    dialog = false,
    ...restProps
  }: {
    id?: string;
    diagram?: string;
    value?: string;
    sourceOffset?: number | string;
    class?: string;
    dialog?: boolean;
    ref?: HTMLElement | null;
    panZoomState?: PanZoomState;
    children?: Snippet<[]>;
  } = $props();

  type MermaidRenderSource = {
    diagram: string;
    config: ReturnType<typeof parseMermaidSource>["config"];
  };
  type Svg2RoughjsConstructor = new (
    target: string | SVGSVGElement | HTMLDivElement | HTMLCanvasElement,
    outputType?: unknown,
    roughConfig?: Record<string, unknown>,
  ) => {
    seed?: unknown;
    randomize?: unknown;
    svg: SVGSVGElement;
    sketch: () => Promise<void>;
  };

  let svgEl: SVGSVGElement = $state()!;
  let copied = $state(false);
  let copiedTimeout: ReturnType<typeof setTimeout> | undefined;
  let renderSource = $derived.by((): MermaidRenderSource => {
    const parsed = parseMermaidSource(diagram ?? value ?? "");
    return { diagram: parsed.diagram, config: parsed.config };
  });
  let renderGeneration = 0;
  let isDisposed = false;
  const renderId = $derived(
    id ??
      `mermaid-${String(sourceOffset ?? "unknown").replace(/[^\w-]/g, "-")}`,
  );

  async function loadSvg2Roughjs(): Promise<Svg2RoughjsConstructor> {
    const module = (await import("svg2roughjs")) as unknown as {
      Svg2Roughjs?: Svg2RoughjsConstructor;
      default?: Svg2RoughjsConstructor | { Svg2Roughjs?: Svg2RoughjsConstructor };
    };
    const candidate =
      module.Svg2Roughjs ??
      (typeof module.default === "function"
        ? module.default
        : module.default?.Svg2Roughjs);

    if (!candidate) {
      throw new Error("svg2roughjs did not expose a Svg2Roughjs constructor.");
    }

    return candidate;
  }

  function createSvg(el: HTMLDivElement, source: MermaidRenderSource) {
    const generation = ++renderGeneration;
    const { diagram, config } = source;

    mermaidRender(renderId, diagram, config)
      .then(({ svg }) => {
        if (isDisposed || generation !== renderGeneration) {
          return undefined;
        }

        if (svg.length > 0) {
          el.innerHTML = svg;
          svgEl = el.querySelector("svg")!;
          const configObject = config as Record<string, any> | undefined;
          const nestedConfig = configObject?.config as
            | Record<string, any>
            | undefined;
          const look = String(
            nestedConfig?.look ?? configObject?.look ?? "",
          ).toLowerCase();
          if (!["rough", "sketch"].includes(look)) {
            return svgEl;
          }

          const opts = (nestedConfig?.[look] ??
            configObject?.[look] ??
            {}) as any;

          return loadSvg2Roughjs().then((Svg2Roughjs) => {
            const svg2roughjs = new Svg2Roughjs(el, undefined, opts);
            if (opts.seed !== undefined) {
              svg2roughjs.seed = opts.seed;
            }
            if (opts.randomize !== undefined) {
              svg2roughjs.randomize = opts.randomize;
            }

            svg2roughjs.svg = svgEl;
            return svg2roughjs.sketch().then(() => {
              svgEl.remove();
              const sketch = el.querySelector("svg")!;
              svgEl = sketch;
              return svgEl;
            });
          });
        }

        return undefined;
      })
      .then((sketch) => {
        if (!sketch || isDisposed || generation !== renderGeneration) {
          return;
        }

        const viewBox = getMermaidSvgViewBox(sketch);
        if (viewBox) {
          applyMermaidSvgLayout(sketch, viewBox, dialog ? "dialog" : "inline");
        }

        setTimeout(() => {
          if (isDisposed || generation !== renderGeneration) {
            return;
          }

          if (dialog) {
            void panZoomState.updateElement(sketch, {
              mouseWheelZoomEnabled: true,
              preventMouseEventsDefault: true,
            });
            return;
          }

          panZoomState.disconnect();
        });
      });
  }

  function mermaidDiagram(el: HTMLDivElement, source: MermaidRenderSource) {
    createSvg(el, source);
    return {
      update(nextSource: MermaidRenderSource) {
        createSvg(el, nextSource);
      },
    };
  }

  async function copySource(): Promise<void> {
    await navigator.clipboard.writeText(renderSource.diagram);
    copied = true;
    if (copiedTimeout) {
      clearTimeout(copiedTimeout);
    }
    copiedTimeout = setTimeout(() => {
      copied = false;
    }, 1200);
  }

  onMount(() => {
    return () => {
      isDisposed = true;
      renderGeneration += 1;
      panZoomState.disconnect();
      if (copiedTimeout) {
        clearTimeout(copiedTimeout);
      }
    };
  });
</script>

<div
  bind:this={ref}
  class="mermaid bg-secondary/30 group relative overflow-auto px-4 py-3 !font-mono whitespace-pre"
>
  <div
    use:mermaidDiagram={renderSource}
    class={cn("text-smz mermaid", className)}
    data-source-offset={sourceOffset}
    {...restProps}
  >
    {@render children?.()}
  </div>
  {#if dialog}
    <div
      class={cn(
        "mermaid-viewer-control-panel group-hover:visible lg:invisible",
        "visible",
      )}
    >
      <Button
        variant="secondary"
        size="sm"
        class="zoom-in"
        onclick={() => panZoomState.zoomIn()}><ZoomIn /></Button
      >
      <Button
        variant="secondary"
        size="sm"
        class="zoom-out"
        onclick={() => panZoomState.zoomOut()}><ZoomOut /></Button
      >
      <Button
        variant="secondary"
        size="sm"
        class="up"
        onclick={() => panZoomState.panBy({ x: 0, y: 100 })}
        ><ChevronUp /></Button
      >
      <Button
        variant="secondary"
        size="sm"
        class="down"
        onclick={() => panZoomState.panBy({ x: 0, y: -100 })}
        ><ChevronDown /></Button
      >
      <Button
        variant="secondary"
        size="sm"
        class="left"
        onclick={() => panZoomState.panBy({ x: 100, y: 0 })}
        ><ChevronLeft /></Button
      >
      <Button
        variant="secondary"
        size="sm"
        class="right"
        onclick={() => panZoomState.panBy({ x: -100, y: 0 })}
        ><ChevronRight /></Button
      >
      <Button
        variant="secondary"
        size="sm"
        class="reset"
        onclick={() => panZoomState.reset()}><Refresh /></Button
      >
    </div>
  {/if}
  {#if !dialog}
    <div
      class="mermaid-inline-controls absolute end-2 top-2 flex gap-1 group-hover:visible lg:invisible"
    >
      <Dialog.Root>
        <Dialog.Trigger
          class={buttonVariants({ size: "sm", variant: "secondary" })}
        >
          <MoveHorizontal />
        </Dialog.Trigger>
        <Dialog.Content
          class="max-h-[85vh] w-[95vw] max-w-[95vw] overflow-hidden p-0 sm:max-h-[85vh] sm:w-[95vw] sm:max-w-[95vw]"
        >
          <Dialog.Title class="sr-only">Mermaid diagram</Dialog.Title>
          <Dialog.Description class="sr-only"
            >Mermaid diagram preview.</Dialog.Description
          >
          <Self id={`dialog-${renderId}`} diagram={renderSource.diagram} dialog />
        </Dialog.Content>
      </Dialog.Root>
      <Button
        variant="secondary"
        size="sm"
        title="Copy Mermaid source"
        aria-label="Copy Mermaid source"
        onclick={() => void copySource()}
      >
        {#if copied}
          <Check />
        {:else}
          <CodeXml />
        {/if}
      </Button>
    </div>
  {/if}
</div>

<style>
  .mermaid-inline-controls {
    visibility: visible;
  }

  .mermaid-viewer-control-panel {
    bottom: 1rem;
    display: grid;
    gap: 0.2em;
    grid-template-columns: 1fr 1fr 1fr;
    position: absolute;
    right: 1rem;
    visibility: visible !important;
    z-index: 1;
  }

  .mermaid-viewer-control-panel :global(button) {
    padding: 5px 7px;
  }

  .mermaid-viewer-control-panel :global(.zoom-in) {
    grid-area: 1 / 3;
  }

  .mermaid-viewer-control-panel :global(.zoom-out) {
    grid-area: 3 / 3;
  }

  .mermaid-viewer-control-panel :global(.reset) {
    grid-area: 2 / 2;
  }

  .mermaid-viewer-control-panel :global(.up) {
    grid-area: 1 / 2;
  }

  .mermaid-viewer-control-panel :global(.down) {
    grid-area: 3 / 2;
  }

  .mermaid-viewer-control-panel :global(.left) {
    grid-area: 2 / 1;
  }

  .mermaid-viewer-control-panel :global(.right) {
    grid-area: 2 / 3;
  }
</style>
