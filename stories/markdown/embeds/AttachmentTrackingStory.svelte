<script lang="ts">
  import { onDestroy } from "svelte";
  import { EditableMarkdownPreview } from "@lapismd/mira/preview";
  import type {
    MiraFileAdapter,
    MiraMarkdownEditingSession,
  } from "@lapismd/mira/extensions";

  let observed = $state(1);
  let saved = $state("# Stable source\n\nThe source session remains attached.");
  let count = 0;
  let registrations = $state(0);
  let session: MiraMarkdownEditingSession | undefined;
  let releaseAdmission: (() => void) | undefined;
  const file = {
    path: "stable.md",
    name: "Stable source",
    kind: "markdown" as const,
  };
  const fileAdapter: MiraFileAdapter = {
    resolveLink: () => null,
    readMarkdown: () => saved,
    writeMarkdown: () => {},
    bindMarkdownEditingSession(_path, captured) {
      void observed;
      registrations = ++count;
      session = captured;
      releaseAdmission = captured.hold!();
      return {
        write: (contents) => {
          saved = contents;
        },
        release() {
          if (session === captured) session = undefined;
        },
      };
    },
  };

  function admit(): void {
    observed = 0;
    releaseAdmission?.();
    releaseAdmission = undefined;
  }
  onDestroy(() => releaseAdmission?.());
</script>

<div class="mira-story-surface" data-registrations={registrations}>
  <fieldset>
    <legend>Fixture controls</legend>
    <button onclick={admit}>Admit source session</button>
    <button onclick={() => (observed += 1)}>Update observation</button>
    <button onclick={() => session?.flush()}>Flush source session</button>
  </fieldset>
  <EditableMarkdownPreview {file} {fileAdapter} returnToPreviewOnBlur={false} />
  <output aria-label="Saved Markdown">{saved}</output>
</div>
