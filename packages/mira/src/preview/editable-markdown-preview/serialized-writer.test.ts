import { describe, expect, it, vi } from "vitest";
import { SerializedMarkdownWriter } from "./serialized-writer";

describe("SerializedMarkdownWriter", () => {
  it("debounces writes for 500ms", async () => {
    vi.useFakeTimers();
    const write = vi.fn();
    const writer = new SerializedMarkdownWriter({ value: "old", write });

    writer.update("one");
    writer.update("two");
    await vi.advanceTimersByTimeAsync(499);
    expect(write).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(write).toHaveBeenCalledOnce();
    expect(write).toHaveBeenCalledWith("two");
    vi.useRealTimers();
  });

  it("serializes writes and flushes the latest value", async () => {
    let releaseFirst: (() => void) | undefined;
    const writes: string[] = [];
    const write = vi.fn((value: string) => {
      writes.push(value);
      if (writes.length === 1) {
        return new Promise<void>((resolve) => {
          releaseFirst = resolve;
        });
      }
    });
    const writer = new SerializedMarkdownWriter({ value: "old", write });

    writer.update("one");
    const firstFlush = writer.flush();
    await Promise.resolve();
    writer.update("two");
    const secondFlush = writer.flush();
    expect(writes).toEqual(["one"]);

    releaseFirst?.();
    await expect(firstFlush).resolves.toBe(true);
    await expect(secondFlush).resolves.toBe(true);
    expect(writes).toEqual(["one", "two"]);
    expect(writer.state.dirty).toBe(false);
  });

  it("preserves dirty data and rejects external replacement after failure", async () => {
    const writer = new SerializedMarkdownWriter({
      value: "old",
      write: async () => {
        throw new Error("disk full");
      },
    });

    writer.update("unsaved");
    await expect(writer.flush()).resolves.toBe(false);
    expect(writer.state).toMatchObject({
      dirty: true,
      saving: false,
      value: "unsaved",
    });
    expect(writer.state.error?.message).toBe("disk full");
    expect(writer.replaceExternal("external")).toBe(false);
    expect(writer.state.value).toBe("unsaved");
  });
});
