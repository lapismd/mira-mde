import { describe, expect, it, vi } from "vitest";
import { SerializedMarkdownWriter } from "./serialized-writer";

describe("SerializedMarkdownWriter", () => {
  it("protection blocks edits immediately and joins in-flight persistence before admission", async () => {
    let releaseWrite!: () => void;
    const saved = new Promise<void>((resolve) => {
      releaseWrite = resolve;
    });
    const write = vi.fn(() => saved);
    const writer = new SerializedMarkdownWriter({ value: "old", write });
    writer.update("local draft");
    const saving = writer.flush();
    let admitted = false;
    const protecting = writer.protect().then((release) => {
      admitted = true;
      return release;
    });
    try {
      expect(writer.state.readonly).toBe(true);
      expect(writer.update("during apply")).toBe(false);
      await Promise.resolve();
      expect(admitted).toBe(false);
      releaseWrite();
      await saving;
      const release = await protecting;
      expect(writer.state.value).toBe("local draft");
      expect(writer.replaceExternal("remote applied")).toBe(true);
      release();
      release();
      expect(writer.state.readonly).toBe(false);
      expect(writer.update("next edit")).toBe(true);
      await writer.flush();
      expect(write).toHaveBeenLastCalledWith("next edit");
    } finally {
      releaseWrite();
      writer.destroy();
    }
  });

  it("protection remains held until every independent lease is released", async () => {
    const writer = new SerializedMarkdownWriter({
      value: "old",
      write: vi.fn(),
    });
    const first = await writer.protect(),
      second = await writer.protect();
    first();
    expect(writer.state.readonly).toBe(true);
    expect(writer.update("blocked")).toBe(false);
    second();
    expect(writer.state.readonly).toBe(false);
    writer.destroy();
  });

  it("protection rejects a failed flush without discarding the unsaved buffer", async () => {
    const failure = new Error("disk full");
    const writer = new SerializedMarkdownWriter({
      value: "old",
      write: () => {
        throw failure;
      },
    });
    writer.update("local draft");
    await expect(writer.protect()).rejects.toBe(failure);
    expect(writer.state).toMatchObject({
      readonly: false,
      dirty: true,
      value: "local draft",
      error: failure,
    });
    writer.destroy();
  });
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
