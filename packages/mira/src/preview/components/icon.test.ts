import { mount, tick, unmount } from "svelte";
import { describe, expect, it } from "vitest";
import Icon from "./icon.svelte";

describe("portable preview icon", () => {
  it("renders canonical Lucide hash geometry", async () => {
    const target = document.createElement("div");
    document.body.append(target);
    const component = mount(Icon, {
      target,
      props: { name: "lucide-hash" },
    });

    await tick();
    expect(target.querySelector('path[d="M4 9h16"]')).not.toBeNull();
    expect(target.querySelector('path[d="M4 15h16"]')).not.toBeNull();
    expect(target.querySelector('path[d="M10 3 8 21"]')).not.toBeNull();
    expect(target.querySelector('path[d="m16 3-2 18"]')).not.toBeNull();

    await unmount(component);
    target.remove();
  });
});
