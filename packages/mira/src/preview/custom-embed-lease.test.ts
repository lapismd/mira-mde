import { describe, expect, it, vi } from "vitest";
import { createCustomEmbedLease } from "./custom-embed-lease";

const target = {
  href: "Note.md",
  path: "Note.md",
  file: { path: "Note.md", name: "Note.md", kind: "markdown" as const },
};
const element = () => ({ replaceChildren: vi.fn() }) as unknown as HTMLElement;

describe("custom embed lease", () => {
  it("keeps synchronous fallback and mounted cleanup compatible", () => {
    const resolved = vi.fn();
    const failed = vi.fn();
    createCustomEmbedLease(() => false, target, element(), resolved, failed)();
    expect(resolved).toHaveBeenCalledExactlyOnceWith(false);
    const cleanup = vi.fn();
    const dispose = createCustomEmbedLease(
      () => cleanup,
      target,
      element(),
      resolved,
      failed,
    );
    dispose();
    dispose();
    expect(cleanup).toHaveBeenCalledOnce();
    expect(failed).not.toHaveBeenCalled();
  });

  it("awaits asynchronous fallback before changing the render decision", async () => {
    let release!: (result: false) => void;
    const pending = new Promise<false>((resolve) => {
      release = resolve;
    });
    const resolved = vi.fn();
    const dispose = createCustomEmbedLease(
      () => pending,
      target,
      element(),
      resolved,
      vi.fn(),
    );
    expect(resolved.mock.calls).toEqual([[true]]);
    release(false);
    await pending;
    expect(resolved.mock.calls).toEqual([[true], [false]]);
    dispose();
  });

  it("aborts retired work and releases cleanup that arrives later", async () => {
    let release!: (cleanup: () => void) => void;
    const pending = new Promise<() => void>((resolve) => {
      release = resolve;
    });
    let signal!: AbortSignal;
    const resolved = vi.fn();
    const cleanup = vi.fn();
    const dispose = createCustomEmbedLease(
      (_target, _element, context) => {
        signal = context!.signal;
        return pending;
      },
      target,
      element(),
      resolved,
      vi.fn(),
    );
    expect(signal.aborted).toBe(false);
    dispose();
    expect(signal.aborted).toBe(true);
    release(cleanup);
    await pending;
    expect(cleanup).toHaveBeenCalledOnce();
    expect(resolved.mock.calls).toEqual([[true]]);
  });

  it("reports a live renderer rejection and permits ordinary fallback", async () => {
    const failure = new Error("renderer unavailable");
    const failed = vi.fn();
    const resolved = vi.fn();
    const pending = Promise.reject(failure);
    const dispose = createCustomEmbedLease(
      () => pending,
      target,
      element(),
      resolved,
      failed,
    );
    await pending.catch(() => {});
    expect(failed).toHaveBeenCalledExactlyOnceWith(failure);
    expect(resolved.mock.calls).toEqual([[true], [false]]);
    dispose();
  });
});
