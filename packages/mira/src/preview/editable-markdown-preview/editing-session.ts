import type {
  MiraFileAdapter,
  MiraMarkdownEditingSession,
} from "../../extensions";
import type { SerializedMarkdownWriter } from "./serialized-writer";

/** Retain detached writers until persistence succeeds so external operations can join them. */
export function attachMarkdownEditingSession(options: {
  writer: SerializedMarkdownWriter;
  sourcePath?: string;
  register?: MiraFileAdapter["registerEditingSession"];
  synchronizeProtection?: () => Promise<void>;
}): { session: MiraMarkdownEditingSession; detach(): void } {
  const { writer } = options;
  let detached = false;
  let remove: (() => void) | void;
  const session: MiraMarkdownEditingSession = {
    get dirty() {
      const state = writer.state;
      return state.dirty || state.saving || state.error !== null;
    },
    async flush() {
      if (!(await writer.flush()))
        throw writer.state.error ?? new Error("Unable to save Markdown");
      if (detached && remove) {
        remove();
        remove = undefined;
      }
    },
    async protect() {
      const release = await writer.protect();
      try {
        await options.synchronizeProtection?.();
        return release;
      } catch (error) {
        release();
        throw error;
      }
    },
  };
  try {
    if (options.sourcePath)
      remove = options.register?.(options.sourcePath, session);
  } catch (error) {
    writer.destroy();
    throw error;
  }
  return {
    session,
    detach() {
      if (detached) return;
      detached = true;
      writer.destroy();
      // A failed detached save remains discoverable, with the writer's error retained.
      void session.flush().catch(() => undefined);
    },
  };
}
