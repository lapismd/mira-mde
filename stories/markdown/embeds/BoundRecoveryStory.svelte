<script lang="ts">
  import { onDestroy } from "svelte";
  import Mira from "@lapismd/mira";
  import { EditableMarkdownPreview } from "@lapismd/mira/preview";
  import type {
    MiraFileAdapter,
    MiraFileRef,
    MiraMarkdownEditingSession,
    MiraMarkdownRecoveryLease,
  } from "@lapismd/mira/extensions";

  let { internalLink = false }: { internalLink?: boolean } = $props();

  const file: MiraFileRef = {
    kind: "markdown",
    path: "notes/original.md",
    name: "Original",
  };
  let disk = $state("# Original\n\nA source-bound preview.");
  let visible = $state(true);
  let registered = $state(0);
  let status = $state("Ready");
  let draft = $state("");
  let rejectWrites = false;
  const sessions = new Set<MiraMarkdownEditingSession>();
  const watchers = new Set<() => void>();
  const targetWatchers = new Set<() => void>();
  let recovery:
    | { session: MiraMarkdownEditingSession; lease: MiraMarkdownRecoveryLease }
    | undefined;
  const fileAdapter: MiraFileAdapter = {
    resolveLink: () => ({ ...file }),
    readMarkdown: () => disk,
    writeMarkdown() {
      throw new Error("A bound preview must not use ordinary persistence");
    },
    bindMarkdownEditingSession(path, session) {
      if (path !== file.path || !session.text)
        throw new Error("Missing source authority");
      sessions.add(session);
      registered = sessions.size;
      const unsubscribe = session.text.subscribe((state) => {
        draft = state.value;
      });
      return {
        write(value) {
          if (rejectWrites) throw new Error("External file changed");
          disk = value;
        },
        release() {
          unsubscribe();
          sessions.delete(session);
          registered = sessions.size;
        },
      };
    },
    watchFile(_target, refresh) {
      watchers.add(refresh);
      return () => watchers.delete(refresh);
    },
    watchTarget(_target, refresh) {
      targetWatchers.add(refresh);
      return () => targetWatchers.delete(refresh);
    },
  };
  async function protect() {
    const session = [...sessions][0];
    status = "Waiting";
    recovery = { session, lease: await session.text!.protectRecovery() };
    status = "Protected";
  }
  function resolve(useExternal: boolean) {
    if (!recovery) throw new Error("Recovery is not held");
    const { session, lease } = recovery;
    disk = useExternal
      ? "# External\n\nReviewed disk content."
      : session.text!.state.value;
    if (useExternal) lease.useExternal(disk);
    else lease.acceptLocal();
    rejectWrites = false;
    lease.release();
    recovery = undefined;
    status = "Ready";
    for (const refresh of watchers) refresh();
  }
  onDestroy(() => recovery?.lease.release());
</script>

<div class="mira-story-surface">
  <button
    onclick={() => {
      rejectWrites = true;
    }}>Fail persistence</button
  >
  <button onclick={protect}>Protect recovery</button>
  <button onclick={() => resolve(true)}>Use external content</button>
  <button onclick={() => resolve(false)}>Accept retained draft</button>
  <button
    onclick={() => {
      for (const refresh of targetWatchers) refresh();
    }}>Refresh link resolution</button
  >
  <button
    onclick={() => {
      visible = false;
    }}>Detach preview</button
  >
  <button
    onclick={() => {
      visible = true;
    }}>Show preview</button
  >
  <output aria-label="Recovery status">{status}</output>
  <output aria-label="Draft Markdown">{draft}</output>
  <output aria-label="Bound sessions">{registered}</output>
  {#if visible}
    {#if internalLink}
      <Mira
        value="[[Original]]"
        mode="preview"
        sourcePath="Home.md"
        {fileAdapter}
      />
    {:else}
      <EditableMarkdownPreview
        {file}
        {fileAdapter}
        returnToPreviewOnBlur={false}
      />
    {/if}
  {/if}
  <output aria-label="Disk Markdown">{disk}</output>
</div>
