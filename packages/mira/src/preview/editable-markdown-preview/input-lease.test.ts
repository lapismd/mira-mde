import { expect, it, vi } from "vitest";
import { attachMarkdownEditingSession } from "./editing-session";
import { SerializedMarkdownWriter } from "./serialized-writer";

it("holds new input synchronously without starting persistence", async () => {
  const write = vi.fn();
  const writer = new SerializedMarkdownWriter({ value: "saved", write });
  const release = writer.hold();
  expect(writer.state.readonly).toBe(true);
  expect(writer.update("blocked")).toBe(false);
  expect(write).not.toHaveBeenCalled();
  release();
  release();
  expect(writer.state.readonly).toBe(false);
  expect(writer.update("later")).toBe(true);
  await writer.flush();
  expect(write).toHaveBeenCalledExactlyOnceWith("later");
  writer.destroy();
});

it("retains a dirty failure and permits explicit persistence while input is held", async () => {
  const failure = new Error("save refused");
  const write = vi
    .fn()
    .mockRejectedValueOnce(failure)
    .mockResolvedValueOnce(undefined);
  const writer = new SerializedMarkdownWriter({ value: "saved", write });
  writer.update("draft");
  expect(await writer.flush()).toBe(false);
  const before = writer.state;
  const release = writer.hold();
  expect(writer.state).toEqual({ ...before, readonly: true });
  expect(write).toHaveBeenCalledTimes(1);
  expect(writer.update("discarded input")).toBe(false);
  expect(await writer.flush()).toBe(true);
  expect(writer.state).toMatchObject({
    readonly: true,
    value: "draft",
    persistedValue: "draft",
    error: null,
  });
  release();
  expect(writer.state.readonly).toBe(false);
  expect(write).toHaveBeenCalledTimes(2);
  writer.destroy();
});

it("does not wait for, cancel or duplicate an already accepted save", async () => {
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const write = vi.fn(() => pending);
  const writer = new SerializedMarkdownWriter({ value: "saved", write });
  writer.update("draft");
  const saving = writer.flush();
  const release = writer.hold();
  expect(typeof release).toBe("function");
  expect(writer.state).toMatchObject({ readonly: true, saving: true });
  finish();
  expect(await saving).toBe(true);
  expect(writer.state).toMatchObject({ readonly: true, dirty: false });
  expect(write).toHaveBeenCalledExactlyOnceWith("draft");
  release();
  writer.destroy();
});

it("keeps independent input and flush-protection leases separate after a save failure", async () => {
  const failure = new Error("save refused");
  const writer = new SerializedMarkdownWriter({
    value: "saved",
    write: vi.fn().mockRejectedValue(failure),
  });
  writer.update("draft");
  const release = writer.hold();
  await expect(writer.protect()).rejects.toBe(failure);
  expect(writer.state).toMatchObject({
    readonly: true,
    dirty: true,
    error: failure,
  });
  release();
  expect(writer.state).toMatchObject({
    readonly: false,
    dirty: true,
    error: failure,
  });
  writer.destroy();
});

it("exposes an independent synchronous lease through a source editing binding", async () => {
  const writer = new SerializedMarkdownWriter({
    value: "saved",
    write: vi.fn(),
  });
  let first!: () => void;
  const attached = attachMarkdownEditingSession({
    writer,
    sourcePath: "note.md",
    bind: (_path, session) => {
      expect(session.hold).toBeTypeOf("function");
      first = session.hold!();
      expect(writer.state.readonly).toBe(true);
      return { write: vi.fn(), release: vi.fn() };
    },
  });
  const second = attached.session.hold!();
  const flushProtection = await attached.session.protect();
  first();
  second();
  expect(writer.state.readonly).toBe(true);
  flushProtection();
  expect(writer.state.readonly).toBe(false);
  attached.detach();
});
