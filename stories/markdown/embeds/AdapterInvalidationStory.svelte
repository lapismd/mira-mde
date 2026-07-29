<script lang="ts">
  import type { MiraFileAdapter, MiraFileRef } from "@mira-mde/extensions";
  import { MarkdownPreview } from "@mira-mde/preview";

  type StoryFile = MiraFileRef & {
    markdown?: string;
  };

  const files = new Map<string, StoryFile>([
    [
      "Mutable Note",
      {
        kind: "markdown",
        markdown:
          "# Mutable Note\n\nThe adapter can invalidate resolved content without remounting the preview.",
        name: "Mutable Note",
        path: "Mutable Note",
      },
    ],
  ]);
  const targetListeners = new Map<string, Set<() => void>>();
  const fileListeners = new Map<string, Set<() => void>>();
  let status = $state("Future Note is unresolved.");

  const adapter: MiraFileAdapter = {
    resolveLink({ path, href }) {
      return files.get(path || href) ?? null;
    },
    readMarkdown(file) {
      return files.get(file.path)?.markdown ?? null;
    },
    watchTarget(target, callback) {
      return subscribe(targetListeners, target.path, callback);
    },
    watchFile(file, callback) {
      return subscribe(fileListeners, file.path, callback);
    },
  };

  const value = [
    "# Target invalidation",
    "",
    "![[Future Note]]",
    "",
    "![[Mutable Note]]",
  ].join("\n");

  function createFutureNote(): void {
    files.set("Future Note", {
      kind: "markdown",
      markdown:
        "# Future Note\n\nThis unresolved embed recovered through `watchTarget`.",
      name: "Future Note",
      path: "Future Note",
    });
    notify(targetListeners, "Future Note");
    status = "Future Note was created and resolved.";
  }

  function updateMutableNote(): void {
    const file = files.get("Mutable Note");
    if (!file) {
      return;
    }
    file.markdown =
      "# Mutable Note\n\n`watchFile` refreshed this content in place.";
    notify(fileListeners, "Mutable Note");
    status = "Mutable Note content was refreshed.";
  }

  function subscribe(
    listeners: Map<string, Set<() => void>>,
    key: string,
    callback: () => void,
  ): () => void {
    const callbacks = listeners.get(key) ?? new Set();
    callbacks.add(callback);
    listeners.set(key, callbacks);
    return () => {
      callbacks.delete(callback);
      if (!callbacks.size) {
        listeners.delete(key);
      }
    };
  }

  function notify(listeners: Map<string, Set<() => void>>, key: string): void {
    for (const callback of listeners.get(key) ?? []) {
      callback();
    }
  }
</script>

<div class="mira-story-surface mira-story-surface--preview">
  <div class="mira-story-actions">
    <button type="button" onclick={createFutureNote}>Create missing note</button
    >
    <button type="button" onclick={updateMutableNote}
      >Update resolved note</button
    >
    <output aria-live="polite">{status}</output>
  </div>
  <MarkdownPreview {value} fileAdapter={adapter} sourcePath="invalidation.md" />
</div>
