import { mount, tick, unmount } from "svelte";
import { describe, expect, it } from "vitest";
import Mira from "./mira.svelte";
import type { MiraHandle } from "./types";

describe("Mira", () => {
  it("exports the Svelte component", () => {
    expect(Mira).toBeTruthy();
  });

  it("renders opaque theme tokens and an independent color mode", async () => {
    const target = document.createElement("div");
    document.body.append(target);
    const component = mount(Mira, {
      target,
      props: {
        value: "# Appearance",
        mode: "preview",
        theme: "obsidian company-brand",
        colorMode: "dark",
      },
    });

    await tick();
    const root = target.querySelector<HTMLElement>(".mira");
    expect(root?.dataset.miraTheme).toBe("obsidian company-brand");
    expect(root?.dataset.miraColorMode).toBe("dark");
    expect(root?.classList.contains("dark")).toBe(true);

    await unmount(component);
    target.remove();
  });

  it("inherits appearance when theme and color mode are omitted", async () => {
    const target = document.createElement("div");
    document.body.append(target);
    const component = mount(Mira, {
      target,
      props: { value: "# Inherit", mode: "preview", theme: "" },
    });

    await tick();
    const root = target.querySelector<HTMLElement>(".mira");
    expect(root?.hasAttribute("data-mira-theme")).toBe(false);
    expect(root?.hasAttribute("data-mira-color-mode")).toBe(false);

    await unmount(component);
    target.remove();
  });

  it("uses the shared action engine through its handle and minimal toolbar", async () => {
    const target = document.createElement("div");
    document.body.append(target);
    const component = mount(Mira, {
      target,
      props: { value: "word", mode: "source" },
    }) as unknown as MiraHandle;

    await tick();
    component.setSelection({
      anchor: { line: 0, ch: 2 },
      head: { line: 0, ch: 2 },
    });
    target.querySelector<HTMLButtonElement>('[aria-label="Bold"]')?.click();
    expect(component.getMarkdown()).toBe("**word**");
    expect(component.applyMarkdownAction("bold")).toBe(true);
    expect(component.getMarkdown()).toBe("word");

    component.setMode("preview");
    expect(component.applyMarkdownAction("italic")).toBe(false);
    expect(component.getMarkdown()).toBe("word");

    await unmount(component as never);
    target.remove();
  });
});
