import { mount, tick, unmount } from "svelte";
import { SvelteMap } from "svelte/reactivity";
import { expect, it, vi } from "vitest";
import type {
  MiraFileAdapter,
  MiraFileRef,
  MiraMarkdownEditingSession,
} from "../../extensions";
import EditableMarkdownPreview from "../editable-markdown-preview.svelte";

it.each(["binding", "registration"] as const)(
  "retains its source session when a %s callback reads changing reactive observations",
  async (hook) => {
    const target = document.createElement("div");
    document.body.append(target);
    const observations = new SvelteMap([["problems", 1]]);
    const sessions: MiraMarkdownEditingSession[] = [];
    const admissions: (() => void)[] = [];
    const released = vi.fn();
    const write = vi.fn();
    const attach = vi.fn(
      (_path: string, session: MiraMarkdownEditingSession) => {
        // A host can synchronously publish and inspect reactive diagnostics here.
        observations.get("problems");
        sessions.push(session);
        admissions.push(session.hold!());
        return released;
      },
    );
    const adapter: MiraFileAdapter = {
      resolveLink: () => null,
      readMarkdown: () => "# Saved note",
      writeMarkdown: write,
      ...(hook === "binding"
        ? {
            bindMarkdownEditingSession(path, session) {
              return { write, release: attach(path, session) };
            },
          }
        : { registerEditingSession: attach }),
    };
    const component = mount(EditableMarkdownPreview, {
      target,
      props: {
        file: { path: "note.md", name: "Note", kind: "markdown" },
        fileAdapter: adapter,
        returnToPreviewOnBlur: false,
      },
    });
    try {
      await vi.waitFor(() => expect(attach).toHaveBeenCalledTimes(1));
      const original = sessions[0]!;
      expect(original.text!.state.readonly).toBe(true);
      expect(target.querySelector('[role="button"]')).toBeNull();

      observations.set("problems", 0);
      admissions[0]!();
      await tick();

      expect(attach).toHaveBeenCalledTimes(1);
      expect(released).not.toHaveBeenCalled();
      expect(original.text!.state.readonly).toBe(false);
      const trigger = target.querySelector<HTMLElement>('[role="button"]');
      expect(trigger).not.toBeNull();
      trigger!.click();
      await tick();
      expect(
        target.querySelector('.cm-content[contenteditable="true"]'),
      ).not.toBeNull();

      observations.set("problems", 2);
      await tick();
      expect(attach).toHaveBeenCalledTimes(1);
      expect(sessions[0]).toBe(original);
      expect(released).not.toHaveBeenCalled();
      expect(write).not.toHaveBeenCalled();
    } finally {
      for (const release of admissions) release();
      await unmount(component);
      target.remove();
    }
    expect(released).toHaveBeenCalledTimes(1);
  },
);

it("replaces the source session when its explicit path, adapter or write capability changes", async () => {
  const target = document.createElement("div");
  document.body.append(target);
  const files = new SvelteMap<string, MiraFileRef>([
    ["selected", { path: "first.md", kind: "markdown" }],
  ]);
  const capabilities = new SvelteMap<string, MiraFileAdapter["writeMarkdown"]>([
    ["write", vi.fn()],
  ]);
  const released = vi.fn();
  const bind = vi.fn(() => ({ write: vi.fn(), release: released }));
  const createAdapter = (): MiraFileAdapter => ({
    resolveLink: () => null,
    readMarkdown: (file) => `# ${file.path}`,
    get writeMarkdown() {
      return capabilities.get("write");
    },
    bindMarkdownEditingSession: bind,
  });
  const adapters = new SvelteMap([["selected", createAdapter()]]);
  const component = mount(EditableMarkdownPreview, {
    target,
    props: {
      get file() {
        return files.get("selected")!;
      },
      get fileAdapter() {
        return adapters.get("selected")!;
      },
    },
  });
  try {
    await vi.waitFor(() => expect(bind).toHaveBeenCalledTimes(1));
    files.set("selected", { path: "second.md", kind: "markdown" });
    await tick();
    expect(bind).toHaveBeenCalledTimes(2);
    expect(bind).toHaveBeenLastCalledWith("second.md", expect.any(Object));
    adapters.set("selected", createAdapter());
    await tick();
    expect(bind).toHaveBeenCalledTimes(3);
    capabilities.set("write", undefined);
    await tick();
    expect(target.querySelector('[role="button"]')).toBeNull();
    expect(released).toHaveBeenCalledTimes(3);
    capabilities.set("write", vi.fn());
    await tick();
    expect(bind).toHaveBeenCalledTimes(4);
    expect(target.querySelector('[role="button"]')).not.toBeNull();
  } finally {
    await unmount(component);
    target.remove();
  }
  expect(released).toHaveBeenCalledTimes(4);
});
