import { createRoot } from "react-dom/client";
import { act, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Bold } from "lucide-react";
import type { MiraMode } from "@mira-mde/extensions";
import {
  MiraDefaultToolbar,
  MiraFeature,
  MiraMde,
  createMiraDefaultEditor,
  resolveMiraDefaultFeatures,
} from ".";

describe("@mira-mde/react", () => {
  it("exports the editor component", () => {
    expect(MiraMde).toBeTruthy();
  });

  it("enables block controls in the default feature set", () => {
    expect(resolveMiraDefaultFeatures()[MiraFeature.BlockControls]).toBe(true);
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

  it("renders the simplified view controls with configurable default edit mode", () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    const onModeChange = vi.fn();

    act(() => {
      root.render(
        <MiraDefaultToolbar
          defaultEditMode="source"
          mode="preview"
          onModeChange={onModeChange}
        />,
      );
    });

    act(() => {
      host.querySelector<HTMLButtonElement>('[aria-label="Edit"]')?.click();
    });
    expect(onModeChange).toHaveBeenCalledWith("source");
    expect(host.querySelector('[aria-label="Split"]')).toBeTruthy();
    act(() => {
      host
        .querySelector<HTMLButtonElement>('[aria-label="View options"]')
        ?.click();
    });
    expect(host.textContent).toContain("Live edit");
    expect(host.textContent).toContain("Source mode");

    act(() => {
      root.unmount();
    });
  });

  it("toggles split view back to the previous mode", () => {
    const host = document.createElement("div");
    const root = createRoot(host);

    function Harness() {
      const [mode, setMode] = useState<MiraMode>("source");
      return (
        <>
          <MiraDefaultToolbar mode={mode} onModeChange={setMode} />
          <span data-testid="mode">{mode}</span>
        </>
      );
    }

    act(() => {
      root.render(<Harness />);
    });

    const splitButton = () =>
      host.querySelector<HTMLButtonElement>('[aria-label="Split"]')!;
    const modeValue = () =>
      host.querySelector<HTMLElement>('[data-testid="mode"]')?.textContent;

    act(() => {
      splitButton().click();
    });
    expect(modeValue()).toBe("split");
    expect(splitButton().getAttribute("aria-pressed")).toBe("true");

    act(() => {
      splitButton().click();
    });
    expect(modeValue()).toBe("source");
    expect(splitButton().getAttribute("aria-pressed")).toBeNull();

    act(() => {
      root.unmount();
    });
  });

  it("creates the default editor from a DOM root", () => {
    const host = document.createElement("div");
    let editor!: ReturnType<typeof createMiraDefaultEditor>;

    act(() => {
      editor = createMiraDefaultEditor({
        features: {
          [MiraFeature.Toolbar]: false,
        },
        root: host,
        value: "# Hello",
      });
    });

    expect(editor.getMarkdown()).toBe("# Hello");
    act(() => {
      editor.setMarkdown("Updated");
    });
    expect(editor.getMarkdown()).toBe("Updated");
    act(() => {
      editor.destroy();
    });
  });
});
