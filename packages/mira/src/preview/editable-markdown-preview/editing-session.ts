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
  bind?: MiraFileAdapter["bindMarkdownEditingSession"];
  synchronizeProtection?: () => Promise<void>;
}): {
  session: MiraMarkdownEditingSession;
  write?: (value: string) => void | Promise<void>;
  detach(): void;
} {
  const { writer } = options;
  let detached = false;
  let remove: (() => void) | void;
  let stop: (() => void) | undefined;
  let releaseError: unknown;
  let write: ((value: string) => void | Promise<void>) | undefined;
  function releaseIfClean(): void {
    const state = writer.state;
    if (!detached || state.dirty || state.saving || state.error !== null)
      return;
    try {
      remove?.();
      remove = undefined;
      releaseError = undefined;
      stop?.();
      stop = undefined;
    } catch (error) {
      releaseError = error ?? new Error("Markdown binding release failed");
    }
  }
  const session: MiraMarkdownEditingSession = {
    get dirty() {
      const state = writer.state;
      return (
        state.dirty ||
        state.saving ||
        state.error !== null ||
        releaseError !== undefined
      );
    },
    async flush() {
      if (!(await writer.flush()))
        throw writer.state.error ?? new Error("Unable to save Markdown");
      releaseIfClean();
      if (releaseError !== undefined) throw releaseError;
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
    text: {
      get state() {
        return writer.state;
      },
      subscribe: (listener) => writer.subscribe(listener),
      async protectRecovery() {
        const lease = await writer.protectRecovery();
        try {
          await options.synchronizeProtection?.();
          return lease;
        } catch (error) {
          lease.release();
          throw error;
        }
      },
    },
  };
  try {
    if (options.bind) {
      if (!options.sourcePath)
        throw new Error("A Markdown binding requires a stable source path");
      const binding = options.bind(options.sourcePath, session);
      if (
        !binding ||
        typeof binding.write !== "function" ||
        typeof binding.release !== "function"
      ) {
        if (typeof binding?.release === "function") binding.release();
        throw new Error("Invalid Markdown editing binding");
      }
      remove = () => binding.release();
      write = (value) => binding.write(value);
    } else if (options.sourcePath)
      remove = options.register?.(options.sourcePath, session);
    stop = writer.subscribe(releaseIfClean);
  } catch (error) {
    writer.destroy();
    throw error;
  }
  return {
    session,
    write,
    detach() {
      if (detached) return;
      detached = true;
      writer.destroy();
      // A failed detached save remains discoverable, with the writer's error retained.
      void session.flush().catch(() => undefined);
    },
  };
}
