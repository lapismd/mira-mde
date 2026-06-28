import { createRoot } from "react-dom/client";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { Bold } from "lucide-react";
import {
  MiraDefaultToolbar,
  MiraFeature,
  MiraMde,
  createMiraDefaultEditor,
} from ".";

describe("@mira-mde/react", () => {
  it("exports the editor component", () => {
    expect(MiraMde).toBeTruthy();
  });

  it("renders the default toolbar with custom React actions", () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    const run = vi.fn();

    act(() => {
      root.render(
        <MiraDefaultToolbar
          featureConfigs={{
            [MiraFeature.Toolbar]: {
              actions: [
                {
                  icon: Bold,
                  id: "custom-bold",
                  label: "Custom bold",
                  run,
                },
              ],
              items: ["bold", "italic"],
            },
          }}
        />,
      );
    });

    expect(
      host.querySelectorAll(".mira-toolbar__button").length,
    ).toBeGreaterThanOrEqual(4);
    host
      .querySelector<HTMLButtonElement>('[aria-label="Custom bold"]')
      ?.click();
    expect(run).toHaveBeenCalledTimes(1);

    act(() => {
      root.unmount();
    });
  });

  it("creates the default editor from a DOM root", () => {
    const host = document.createElement("div");
    const editor = createMiraDefaultEditor({
      features: {
        [MiraFeature.Toolbar]: false,
      },
      root: host,
      value: "# Hello",
    });

    expect(editor.getMarkdown()).toBe("# Hello");
    editor.setMarkdown("Updated");
    expect(editor.getMarkdown()).toBe("Updated");
    editor.destroy();
  });
});
