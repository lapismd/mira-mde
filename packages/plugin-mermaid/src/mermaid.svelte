<script lang="ts">
  import { onMount } from "svelte";
  import mermaid from "mermaid";

  type Props = {
    value?: string;
    ref?: HTMLElement | null;
  };

  let { value = "", ref = $bindable(null) }: Props = $props();
  let svg = $state("");
  let error = $state<string | null>(null);
  const id = `mira-mermaid-${Math.random().toString(36).slice(2)}`;

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: "default",
  });

  async function renderDiagram(): Promise<void> {
    if (!value.trim()) {
      svg = "";
      error = null;
      return;
    }

    try {
      const result = await mermaid.render(id, value);
      svg = result.svg;
      error = null;
    } catch (cause) {
      svg = "";
      error = cause instanceof Error ? cause.message : String(cause);
    }
  }

  onMount(() => {
    void renderDiagram();
  });

  $effect(() => {
    value;
    void renderDiagram();
  });
</script>

<div
  bind:this={ref}
  class="mira-mermaid"
  data-rendered={svg ? "true" : "false"}
>
  {#if error}
    <pre class="mira-mermaid__error">{error}</pre>
  {:else if svg}
    {@html svg}
  {:else}
    <pre>{value}</pre>
  {/if}
</div>
