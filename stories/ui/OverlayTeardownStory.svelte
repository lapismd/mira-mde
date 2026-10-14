<script lang="ts">
  import { flushSync, mount, tick, unmount } from "svelte";
  import OverlayTeardownContent from "./OverlayTeardownContent.svelte";

  let target: HTMLDivElement;
  let completed = $state(0);

  async function exerciseTeardown() {
    // A property editor can be replaced before its overlay's deferred layer
    // registration fires. Mount a real public Mira menu and destroy its owner
    // in the same task, after Svelte has installed its DOM/effects.
    const content = mount(OverlayTeardownContent, { target });
    flushSync();
    await tick();
    await unmount(content);
    completed += 1;
  }
</script>

<button onclick={() => void exerciseTeardown()}
  >Mount and destroy property menu</button
>
<div bind:this={target}></div>
<p role="status">Completed teardown: {completed}</p>
