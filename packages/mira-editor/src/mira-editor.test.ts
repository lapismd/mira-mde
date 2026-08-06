import { mount, tick, unmount } from "svelte";
import BoldIcon from "@lucide/svelte/icons/bold";
import { describe, expect, it, vi } from "vitest";
import type { MiraExtensionRuntimeContext } from "@lapismd/mira/extensions";
import type { MiraEditorHandle } from "./types";
import MiraEditor from "./mira-editor.svelte";

describe("MiraEditor extension contributions", () => {
  it("normalizes framework block-menu actions with active block context", async () => {
    const target = document.createElement("div");
    document.body.append(target);
    const run = vi.fn();
    const component = mount(MiraEditor, {
      target,
      props: {
        featureConfigs: {
          "block-controls": { toolbar: true },
        },
        mode: "source",
        theme: "obsidian company-brand",
        colorMode: "dark",
        toolbarActions: [
          {
            id: "inspect-block",
            label: "Inspect block",
            icon: BoldIcon,
            placements: ["block-menu"],
            shortcut: "⌘I",
            run,
          },
        ],
        value: "Paragraph",
      },
    });

    await tick();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(target.querySelector('[aria-label="Inspect block"]')).toBeNull();
    target
      .querySelector<HTMLButtonElement>(".mira-block-toolbar-trigger")
      ?.click();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const action = document.body.querySelector<HTMLButtonElement>(
      '[data-block-toolbar-item="mira-editor-inspect-block"]',
    );
    expect(action?.textContent).toContain("Inspect block");
    expect(action?.textContent).toContain("⌘I");
    expect(action?.querySelector("svg")).not.toBeNull();
    const portal = action?.closest(".mira-block-toolbar-portal");
    expect(portal?.getAttribute("data-mira-theme")).toBe(
      "obsidian company-brand",
    );
    expect(portal?.getAttribute("data-mira-color-mode")).toBe("dark");
    action?.click();

    expect(run).toHaveBeenCalledWith(
      expect.objectContaining({
        block: expect.objectContaining({ text: "Paragraph" }),
        handle: expect.objectContaining({ role: "block" }),
        replaceRange: expect.any(Function),
      }),
    );

    await unmount(component as never);
    target.remove();
  });

  it("exposes context-aware Markdown actions on the public handle", async () => {
    const target = document.createElement("div");
    document.body.append(target);
    const component = mount(MiraEditor, {
      target,
      props: { value: "word", mode: "source" },
    }) as unknown as MiraEditorHandle;

    await tick();
    component.setSelection({
      anchor: { line: 0, ch: 2 },
      head: { line: 0, ch: 2 },
    });
    expect(component.applyMarkdownAction("bold")).toBe(true);
    expect(component.getMarkdown()).toBe("**word**");

    component.setMode("preview");
    expect(component.applyMarkdownAction("italic")).toBe(false);
    expect(component.getMarkdown()).toBe("**word**");

    await unmount(component as never);
    target.remove();
  });

  it("applies targeted appearance to the shell and portaled menus", async () => {
    const target = document.createElement("div");
    document.body.append(target);
    const component = mount(MiraEditor, {
      target,
      props: {
        value: "# Targeted appearance",
        theme: "obsidian company-brand",
        colorMode: "dark",
      },
    });

    await tick();
    const shell = target.querySelector<HTMLElement>(".mira-editor");
    expect(shell?.dataset.miraTheme).toBe("obsidian company-brand");
    expect(shell?.dataset.miraColorMode).toBe("dark");

    target
      .querySelector<HTMLButtonElement>('[aria-label="View options"]')
      ?.click();
    await tick();

    const menu = document.body.querySelector<HTMLElement>(
      '[data-slot="dropdown-menu-content"]',
    );
    expect(menu?.dataset.miraTheme).toBe("obsidian company-brand");
    expect(menu?.dataset.miraColorMode).toBe("dark");
    expect(menu?.hasAttribute("data-mira-overlay")).toBe(true);

    await unmount(component as never);
    target.remove();
  });

  it("runs extension commands from the toolbar and mounts extension styles", async () => {
    const target = document.createElement("div");
    document.body.append(target);
    const run = vi.fn((context: MiraExtensionRuntimeContext) => {
      context.insertMarkdown("Extension command", 9);
    });
    const component = mount(MiraEditor, {
      target,
      props: {
        extensions: [
          {
            name: "command-example",
            commands: [
              {
                id: "insert-extension-command",
                label: "Insert extension command",
                run,
              },
            ],
            toolbarItems: [
              {
                id: "insert-extension-command",
                label: "Insert extension command",
                command: "insert-extension-command",
                icon: "sparkles",
              },
            ],
            styles: [
              {
                id: "command-example-style",
                cssText: ".command-example { color: rebeccapurple; }",
              },
            ],
          },
        ],
        value: "",
      },
    }) as unknown as MiraEditorHandle;

    await tick();

    expect(component.getCommands().map((command) => command.id)).toContain(
      "insert-extension-command",
    );
    expect(component.isCommandEnabled("insert-extension-command")).toBe(true);
    expect(
      document.head.querySelector(
        '[data-mira-extension-style="id:command-example-style"]',
      ),
    ).toBeTruthy();

    document.body
      .querySelector<HTMLButtonElement>(
        '[aria-label="Insert extension command"]',
      )
      ?.click();
    await tick();

    expect(run).toHaveBeenCalledTimes(1);
    expect(component.getMarkdown()).toBe("Extension command");
    expect(component.getSelection()).toEqual({
      anchor: { line: 0, ch: 9 },
      head: { line: 0, ch: 9 },
    });

    unmount(component as never);
    target.remove();
    expect(
      document.head.querySelector(
        '[data-mira-extension-style="id:command-example-style"]',
      ),
    ).toBeNull();
  });

  it("places portable extension toolbar commands in the block menu explicitly", async () => {
    const target = document.createElement("div");
    document.body.append(target);
    const run = vi.fn();
    const component = mount(MiraEditor, {
      target,
      props: {
        extensions: [
          {
            name: "block-command-example",
            commands: [
              {
                id: "inspect-extension-block",
                label: "Inspect extension block",
                run,
              },
            ],
            toolbarItems: [
              {
                id: "inspect-extension-block",
                label: "Inspect extension block",
                command: "inspect-extension-block",
                icon: "sparkles",
                placements: ["block-menu"],
                shortcut: "⌘E",
              },
            ],
          },
        ],
        featureConfigs: { "block-controls": { toolbar: true } },
        mode: "source",
        value: "Portable block",
      },
    });

    await tick();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(
      target.querySelector('[aria-label="Inspect extension block"]'),
    ).toBeNull();
    target
      .querySelector<HTMLButtonElement>(".mira-block-toolbar-trigger")
      ?.click();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    document.body
      .querySelector<HTMLButtonElement>(
        '[data-block-toolbar-item="toolbar-inspect-extension-block"]',
      )
      ?.click();

    expect(run).toHaveBeenCalledWith(
      expect.objectContaining({
        block: expect.objectContaining({ text: "Portable block" }),
        handle: expect.objectContaining({ role: "block" }),
      }),
    );
    await unmount(component as never);
    target.remove();
  });
});
