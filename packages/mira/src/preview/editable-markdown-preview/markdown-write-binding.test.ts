import { expect, it, vi } from "vitest";
import type {
  MiraMarkdownEditingSession,
  MiraMarkdownRecoveryLease,
} from "../../extensions";
import { attachMarkdownEditingSession } from "./editing-session";
import { SerializedMarkdownWriter } from "./serialized-writer";

it("binds transport to the captured source session instead of the legacy callback", async () => {
  const legacy = vi.fn(),
    bound = vi.fn(),
    release = vi.fn();
  let persist: (value: string) => void | Promise<void> = legacy;
  const writer = new SerializedMarkdownWriter({
    value: "original",
    write: (value) => persist(value),
  });
  const register = vi.fn();
  const bind = vi.fn((path: string, session: MiraMarkdownEditingSession) => {
    expect(path).toBe("original.md");
    expect(session.text!.state.persistedValue).toBe("original");
    return { write: bound, release };
  });
  const attached = attachMarkdownEditingSession({
    writer,
    sourcePath: "original.md",
    register,
    bind,
  });
  persist = attached.write ?? legacy;
  writer.update("draft");
  await attached.session.flush();
  expect(bound).toHaveBeenCalledExactlyOnceWith("draft");
  expect(legacy).not.toHaveBeenCalled();
  expect(register).not.toHaveBeenCalled();
  attached.detach();
  expect(release).toHaveBeenCalledOnce();
});

it("protects recovery immediately and settles a failed flight without retrying it", async () => {
  let reject!: (error: Error) => void;
  const flight = new Promise<void>((_resolve, rejectPromise) => {
    reject = rejectPromise;
  });
  const write = vi.fn(() => flight),
    failure = new Error("changed externally");
  const writer = new SerializedMarkdownWriter({ value: "original", write });
  const attached = attachMarkdownEditingSession({ writer });
  writer.update("draft");
  const saving = writer.flush();
  const protecting = attached.session.text!.protectRecovery();
  expect(writer.state.readonly).toBe(true);
  expect(writer.update("blocked")).toBe(false);
  reject(failure);
  await expect(saving).resolves.toBe(false);
  const lease = await protecting;
  expect(write).toHaveBeenCalledTimes(1);
  expect(writer.state.error).toBe(failure);
  await lease.useExternal("disk version");
  expect(writer.state).toMatchObject({
    value: "disk version",
    persistedValue: "disk version",
    dirty: false,
    error: null,
    readonly: true,
  });
  lease.release();
  expect(writer.state.readonly).toBe(false);
  attached.detach();
});

it("acknowledges a protected retained draft and rejects use of an expired lease", async () => {
  const writer = new SerializedMarkdownWriter({
    value: "original",
    write: vi.fn(),
  });
  const attached = attachMarkdownEditingSession({ writer });
  writer.update("draft");
  const first = await attached.session.text!.protectRecovery();
  const second = await attached.session.text!.protectRecovery();
  await first.acceptLocal();
  expect(writer.state).toMatchObject({
    value: "draft",
    persistedValue: "draft",
    dirty: false,
  });
  first.release();
  first.release();
  expect(writer.state.readonly).toBe(true);
  expect(() => first.useExternal("stale")).toThrow(/expired/i);
  second.release();
  expect(writer.state.readonly).toBe(false);
  attached.detach();
});

it("retains failure after undo and refuses external refresh until explicit recovery", async () => {
  const failure = new Error("external conflict");
  const write = vi.fn(() => {
    throw failure;
  });
  const writer = new SerializedMarkdownWriter({ value: "original", write });
  const attached = attachMarkdownEditingSession({ writer });
  writer.update("failed draft");
  await expect(attached.session.flush()).rejects.toBe(failure);
  writer.update("original");
  expect(attached.session.dirty).toBe(true);
  expect(writer.replaceExternal("external")).toBe(false);
  await expect(attached.session.flush()).rejects.toBe(failure);
  const lease = await attached.session.text!.protectRecovery();
  await lease.useExternal("external");
  lease.release();
  expect(attached.session.dirty).toBe(false);
  attached.detach();
});

it("keeps a detached failed binding registered until protected recovery acknowledges it", async () => {
  const release = vi.fn(),
    failure = new Error("external conflict");
  let persist: (value: string) => void | Promise<void> = vi.fn();
  const writer = new SerializedMarkdownWriter({
    value: "original",
    write: (value) => persist(value),
  });
  const attached = attachMarkdownEditingSession({
    writer,
    sourcePath: "note.md",
    bind: () => ({
      write: () => {
        throw failure;
      },
      release,
    }),
  });
  persist = attached.write!;
  writer.update("retired draft");
  await expect(attached.session.flush()).rejects.toBe(failure);
  attached.detach();
  await expect(attached.session.flush()).rejects.toBe(failure);
  expect(release).not.toHaveBeenCalled();
  const lease = await attached.session.text!.protectRecovery();
  await lease.acceptLocal();
  lease.release();
  expect(release).toHaveBeenCalledOnce();
  expect(writer.state.readonly).toBe(true);
});

it("publishes state changes to host subscribers without changing legacy write arity", async () => {
  const write = vi.fn(),
    listener = vi.fn();
  const writer = new SerializedMarkdownWriter({ value: "original", write });
  const attached = attachMarkdownEditingSession({ writer });
  const stop = attached.session.text!.subscribe(listener);
  writer.update("draft");
  await attached.session.flush();
  expect(listener).toHaveBeenLastCalledWith(
    expect.objectContaining({ persistedValue: "draft", dirty: false }),
  );
  expect(write).toHaveBeenCalledExactlyOnceWith("draft");
  stop();
  const count = listener.mock.calls.length;
  attached.detach();
  expect(listener).toHaveBeenCalledTimes(count);
});

it("rejects a bound writer without source authority instead of silently using legacy persistence", () => {
  const legacy = vi.fn(),
    bind = vi.fn();
  const writer = new SerializedMarkdownWriter({
    value: "original",
    write: legacy,
  });
  expect(() => attachMarkdownEditingSession({ writer, bind })).toThrow(
    /source/i,
  );
  expect(writer.update("unsafe")).toBe(false);
  expect(legacy).not.toHaveBeenCalled();
  expect(bind).not.toHaveBeenCalled();
});

it("releases recovery protection when synchronizing the surface fails", async () => {
  const failure = new Error("surface synchronization failed");
  const writer = new SerializedMarkdownWriter({
    value: "original",
    write: vi.fn(),
  });
  const attached = attachMarkdownEditingSession({
    writer,
    synchronizeProtection: async () => {
      throw failure;
    },
  });
  await expect(attached.session.text!.protectRecovery()).rejects.toBe(failure);
  expect(writer.state.readonly).toBe(false);
  attached.detach();
});

it("keeps external refresh and ordinary flush outside a held recovery decision", async () => {
  const writer = new SerializedMarkdownWriter({
    value: "original",
    write: vi.fn(),
  });
  const lease = await writer.protectRecovery();
  expect(writer.replaceExternal("unreviewed disk")).toBe(false);
  await expect(writer.flush()).resolves.toBe(false);
  lease.useExternal("reviewed disk");
  expect(writer.replaceExternal("later disk")).toBe(false);
  expect(writer.state.value).toBe("reviewed disk");
  lease.release();
  expect(writer.replaceExternal("later disk")).toBe(true);
  writer.destroy();
});

it("settles an active write when a state subscriber requests recovery", async () => {
  let complete!: () => void;
  const flight = new Promise<void>((resolve) => {
    complete = resolve;
  });
  const writer = new SerializedMarkdownWriter({
    value: "original",
    write: () => flight,
  });
  let recovery: Promise<MiraMarkdownRecoveryLease> | undefined;
  let requested = false,
    admitted = false;
  const stop = writer.subscribe((state) => {
    if (!state.saving || requested) return;
    requested = true;
    recovery = writer.protectRecovery().then((lease) => {
      admitted = true;
      return lease;
    });
  });
  writer.update("draft");
  const saving = writer.flush();
  await Promise.resolve();
  expect(admitted).toBe(false);
  complete();
  await saving;
  const lease = await recovery!;
  lease.acceptLocal();
  lease.release();
  stop();
  writer.destroy();
});

it("rejects malformed bindings without calling a non-function cleanup or falling back", () => {
  const legacy = vi.fn();
  const writer = new SerializedMarkdownWriter({
    value: "original",
    write: legacy,
  });
  expect(() =>
    attachMarkdownEditingSession({
      writer,
      sourcePath: "note.md",
      // A runtime adapter need not have passed TypeScript validation.
      bind: () => ({ write: undefined, release: "invalid" }) as never,
    }),
  ).toThrow("Invalid Markdown editing binding");
  expect(writer.update("unsafe")).toBe(false);
  expect(legacy).not.toHaveBeenCalled();
});

it("retains a failed binding cleanup as a lifecycle barrier until retry succeeds", async () => {
  const failure = new Error("registration release failed");
  const release = vi.fn().mockImplementationOnce(() => {
    throw failure;
  });
  const writer = new SerializedMarkdownWriter({
    value: "original",
    write: vi.fn(),
  });
  const attached = attachMarkdownEditingSession({
    writer,
    sourcePath: "note.md",
    bind: () => ({ write: vi.fn(), release }),
  });
  attached.detach();
  await Promise.resolve();
  expect(attached.session.dirty).toBe(true);
  await attached.session.flush();
  expect(attached.session.dirty).toBe(false);
  expect(release).toHaveBeenCalledTimes(2);
});
