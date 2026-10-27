<script lang="ts">
  import { tick } from "svelte";
  import { MiraCodeEditor } from "@lapismd/mira";

  let value = $state("Alpha beta Alpha\n");
  let open = $state(false);
  let dialog = $state<HTMLDivElement>();

  async function showOverlay() {
    open = true;
    await tick();
    dialog?.focus();
  }
</script>

<div class="overlay-fixture" data-testid="overlay-fixture">
  <button onclick={showOverlay}>Open host overlay</button>
  <MiraCodeEditor bind:value ariaLabel="Overlay test editor" />
  {#if open}
    <div
      bind:this={dialog}
      class="host-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Host overlay"
      tabindex="-1"
    >
      <button onclick={() => (open = false)}>Close host overlay</button>
    </div>
  {/if}
</div>

<style>
  .overlay-fixture {
    position: relative;
    min-height: 24rem;
  }

  .host-overlay {
    position: absolute;
    inset: 0;
    z-index: 1;
    background: var(--mira-background, white);
  }
</style>
