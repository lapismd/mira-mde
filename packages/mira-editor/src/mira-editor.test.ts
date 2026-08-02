import { mount, tick, unmount } from "svelte";
import { describe, expect, it, vi } from "vitest";
import type { MiraExtensionRuntimeContext } from "@lapismd/mira/extensions";
import type { MiraEditorHandle } from "./types";
import MiraEditor from "./mira-editor.svelte";

describe("MiraEditor extension contributions", () => {
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

    target
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
});
