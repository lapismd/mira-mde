<script lang="ts">
  import { onDestroy } from "svelte";
  import { EditableMarkdownPreview } from "@lapismd/mira/preview";
  import type {
    MiraFileAdapter,
    MiraFileRef,
    MiraMarkdownEditingSession,
  } from "@lapismd/mira/extensions";

  const first: MiraFileRef = {
    kind: "markdown",
    name: "First",
    path: "notes/first.md",
  };
  const second: MiraFileRef = {
    kind: "markdown",
    name: "Second",
    path: "notes/second.md",
  };
  let file = $state(first);
  let values = $state({
    "notes/first.md": "# First\n\nEdit this note before an external update.",
    "notes/second.md": "# Second\n\nA separate document.",
  });
  let paused = false;
  let finishWrite: (() => void) | undefined;
  let session: MiraMarkdownEditingSession | undefined;
  let registered = $state(false);
  let state = $state("Ready");
  let error = $state("");
  let releaseProtection: (() => void) | undefined;
  const watchers = new Set<() => void>();
  const fileAdapter: MiraFileAdapter = {
    resolveLink: () => file,
    readMarkdown: (target) => values[target.path as keyof typeof values],
    async writeMarkdown(target, value) {
      if (paused)
        await new Promise<void>((resolve) => {
          finishWrite = resolve;
        });
      values[target.path as keyof typeof values] = value;
    },
    watchFile: (_target, refresh) => {
      watchers.add(refresh);
      return () => watchers.delete(refresh);
    },
    registerEditingSession(_path, value) {
      session = value;
      registered = true;
      return () => {
        if (session === value) {
          session = undefined;
          registered = false;
        }
      };
    },
  };

  async function protect() {
    state = "Waiting for persistence";
    try {
      releaseProtection = await session!.protect();
      state = "Protected";
    } catch (cause) {
      error = String(cause);
    }
  }

  function finish() {
    paused = false;
    finishWrite?.();
  }
  function unprotect() {
    releaseProtection?.();
    releaseProtection = undefined;
    state = "Ready";
  }
  function apply() {
    values["notes/first.md"] =
      "# Incoming\n\nApplied while the editor is protected.";
    for (const refresh of watchers) refresh();
  }
  onDestroy(() => {
    finish();
    unprotect();
  });
</script>

<div class="mira-story-surface" data-session-registered={registered}>
  <div>
    <button
      onclick={() => {
        paused = true;
      }}>Pause persistence</button
    >
    <button onclick={protect}>Protect editor</button>
    <button onclick={finish}>Finish save</button>
    <button onclick={apply}>Apply external change</button>
    <button onclick={unprotect}>Release editor</button>
    <button
      onclick={() => {
        file = second;
      }}>Switch document</button
    >
  </div>
  <output aria-label="Protection state">{state}</output>
  {#if error}<p role="alert">{error}</p>{/if}
  <EditableMarkdownPreview {file} {fileAdapter} returnToPreviewOnBlur={false} />
  <output aria-label="Original Markdown">{values["notes/first.md"]}</output>
  <output aria-label="Other Markdown">{values["notes/second.md"]}</output>
</div>
