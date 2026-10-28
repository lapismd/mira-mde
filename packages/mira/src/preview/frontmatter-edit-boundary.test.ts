import { mount, tick, unmount } from "svelte";
import { SvelteMap } from "svelte/reactivity";
import { expect, it, vi } from "vitest";
import FrontmatterEditor from "./components/frontmatter.svelte";
import TextInput from "./components/frontmatter-property-text-input.svelte";
import {
  FrontmatterController,
  createFrontmatterPropertyManager,
  type FrontmatterControllerCommit,
} from "./frontmatter";

it.each([false, true])(
  "refuses a focused edit after source target replacement (before blur: %s)",
  async (beforeBlur) => {
    const target = document.createElement("div");
    document.body.append(target);
    const original = vi.fn(),
      replacement = vi.fn(),
      onActionError = vi.fn();
    const controller = new FrontmatterController({
      sourcePath: "first.md",
      record: { status: "ready" },
      propertyManager: createFrontmatterPropertyManager({ onActionError }),
      onRecordChange: original,
    });
    const component = mount(FrontmatterEditor, {
      target,
      props: { controller, open: true, showChrome: false },
    });
    const replace = () => {
      controller.update({
        sourcePath: "second.md",
        onRecordChange: replacement,
      });
      controller.syncRecord({ status: "second", owner: "new target" });
    };
    try {
      await tick();
      const input = target.querySelector<HTMLElement>(
        '[aria-label="status value"]',
      )!;
      input.focus();
      input.textContent = "local first-file edit";
      input.dispatchEvent(new InputEvent("input", { bubbles: true }));
      if (beforeBlur) {
        replace();
        await tick();
      }
      input.blur();
      if (!beforeBlur) replace();
      await tick();
      expect(original).not.toHaveBeenCalled();
      expect(replacement).not.toHaveBeenCalled();
      expect(controller.getRecord()).toEqual({
        status: "second",
        owner: "new target",
      });
      expect(onActionError).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ message: "Frontmatter edit target changed" }),
        "edit",
      );
    } finally {
      await unmount(component);
      target.remove();
    }
  },
);

it.each([false, true])(
  "retains focused text and its rendered baseline (refresh queued before focus: %s)",
  async (queuedBeforeFocus) => {
    const target = document.createElement("div");
    document.body.append(target);
    const commits: FrontmatterControllerCommit[] = [];
    const controller = new FrontmatterController({
      record: { status: "ready" },
      onRecordChange: (commit) => {
        commits.push(commit);
      },
    });
    const component = mount(FrontmatterEditor, {
      target,
      props: { controller, open: true, showChrome: false },
    });
    try {
      await tick();
      const input = target.querySelector<HTMLElement>(
        '[aria-label="status value"]',
      )!;
      if (queuedBeforeFocus)
        controller.syncRecord({ status: "external", owner: "outside" });
      input.focus();
      input.textContent = "local";
      input.dispatchEvent(new InputEvent("input", { bubbles: true }));
      if (!queuedBeforeFocus) {
        await tick();
        controller.syncRecord({ status: "external", owner: "outside" });
      }
      await tick();
      expect(input.ownerDocument.activeElement).toBe(input);
      expect(input.textContent).toBe("local");
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
      await tick();
      expect(commits).toHaveLength(1);
      expect(commits[0]!.previousRecord).toEqual({ status: "ready" });
      expect(commits[0]!.record).toEqual({ status: "local" });
    } finally {
      await unmount(component);
      target.remove();
    }
  },
);

it.each([false, true])(
  "commits event-time blur text through its focused callback (replacement: %s)",
  async (replaceCallback) => {
    const target = document.createElement("div");
    document.body.append(target);
    const original = vi.fn(),
      newer = vi.fn();
    const callbacks = new SvelteMap([["commit", original]]);
    const component = mount(TextInput, {
      target,
      props: {
        value: "ready",
        propertyKey: "status",
        ariaLabel: "status value",
        get onCommit() {
          return callbacks.get("commit")!;
        },
      },
    });
    try {
      await tick();
      const input = target.querySelector<HTMLElement>(
        '[aria-label="status value"]',
      )!;
      input.focus();
      input.textContent = "local";
      input.dispatchEvent(new InputEvent("input", { bubbles: true }));
      if (replaceCallback) callbacks.set("commit", newer);
      await tick();
      input.blur();
      input.textContent = "later DOM replacement";
      await tick();
      expect(original).toHaveBeenCalledExactlyOnceWith("local");
      expect(newer).not.toHaveBeenCalled();
    } finally {
      await unmount(component);
      target.remove();
    }
  },
);
