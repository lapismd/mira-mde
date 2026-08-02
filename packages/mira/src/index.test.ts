import { mount, tick, unmount } from "svelte";
import { describe, expect, it } from "vitest";
import Mira from "./mira.svelte";

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
});
