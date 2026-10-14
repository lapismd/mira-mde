import { expect, it, vi } from "vitest";
import type { MiraMarkdownEditingSession } from "../../extensions";
import { attachMarkdownEditingSession } from "./editing-session";
import { SerializedMarkdownWriter } from "./serialized-writer";

it("disables an unregistered writer when host session registration rejects", () => {
  const writer = new SerializedMarkdownWriter({ value: "old", write: vi.fn() });
  const failure = new Error("editing admission rejected");
  try {
    expect(() =>
      attachMarkdownEditingSession({
        writer,
        sourcePath: "note.md",
        register: () => {
          throw failure;
        },
      }),
    ).toThrow(failure);
    expect(writer.state.readonly).toBe(true);
    expect(writer.update("untracked write")).toBe(false);
  } finally {
    writer.destroy();
  }
});

it("keeps a detached session discoverable until its captured write finishes", async () => {
  let release!: () => void;
  const saved = new Promise<void>((resolve) => {
    release = resolve;
  });
  const write = vi.fn(() => saved),
    remove = vi.fn();
  let session!: MiraMarkdownEditingSession;
  const writer = new SerializedMarkdownWriter({ value: "old", write });
  const attached = attachMarkdownEditingSession({
    writer,
    sourcePath: "original.md",
    register: (path, value) => {
      expect(path).toBe("original.md");
      session = value;
      return remove;
    },
  });
  writer.update("unsaved");
  attached.detach();
  expect(remove).not.toHaveBeenCalled();
  expect(session.dirty).toBe(true);
  release();
  await session.flush();
  expect(write).toHaveBeenCalledExactlyOnceWith("unsaved");
  expect(remove).toHaveBeenCalledOnce();
  attached.detach();
  expect(remove).toHaveBeenCalledOnce();
});

it("retains a failed detached writer for a later host retry", async () => {
  const failure = new Error("disk full");
  const write = vi
    .fn()
    .mockRejectedValueOnce(failure)
    .mockResolvedValue(undefined);
  const remove = vi.fn();
  let session!: MiraMarkdownEditingSession;
  const writer = new SerializedMarkdownWriter({ value: "old", write });
  const attached = attachMarkdownEditingSession({
    writer,
    sourcePath: "note.md",
    register: (_path, value) => {
      session = value;
      return remove;
    },
  });
  writer.update("unsaved");
  attached.detach();
  await expect(session.flush()).rejects.toBe(failure);
  expect(remove).not.toHaveBeenCalled();
  expect(session.dirty).toBe(true);
  await session.flush();
  expect(remove).toHaveBeenCalledOnce();
  expect(write).toHaveBeenLastCalledWith("unsaved");
});

it("waits for surface protection to settle and releases it if that fails", async () => {
  const failure = new Error("surface disposed");
  let release!: () => void;
  const settled = new Promise<void>((resolve) => {
    release = resolve;
  });
  const writer = new SerializedMarkdownWriter({ value: "old", write: vi.fn() });
  const synchronizeProtection = vi.fn(() => settled);
  const attached = attachMarkdownEditingSession({
    writer,
    synchronizeProtection,
  });
  const protecting = attached.session.protect();
  expect(writer.state.readonly).toBe(true);
  release();
  const unprotect = await protecting;
  expect(synchronizeProtection).toHaveBeenCalledOnce();
  unprotect();
  synchronizeProtection.mockRejectedValueOnce(failure);
  await expect(attached.session.protect()).rejects.toBe(failure);
  expect(writer.state.readonly).toBe(false);
  attached.detach();
});
