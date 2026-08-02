import { createRoot } from "react-dom/client";
import { act, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Bold } from "lucide-react";
import type {
  MiraExtensionRuntimeContext,
  MiraMode,
} from "@lapismd/mira/extensions";
import {
  MiraEditorToolbar,
  MiraEditor,
  MiraFeature,
  Mira,
  resolveMiraEditorFeatures,
} from ".";

describe("@lapismd/mira-react", () => {
  it("exports the editor component", () => {
    expect(Mira).toBeTruthy();
  });

  it("passes open-ended theme tokens and color mode to React surfaces", () => {
    const host = document.createElement("div");
    const root = createRoot(host);

    act(() => {
      root.render(
        <Mira
          value="# React appearance"
          mode="source"
          theme="obsidian company-brand"
          colorMode="light"
        />,
      );
    });

    const editor = host.querySelector<HTMLElement>(".mira");
    expect(editor?.dataset.miraTheme).toBe("obsidian company-brand");
    expect(editor?.dataset.miraColorMode).toBe("light");
    expect(editor?.classList.contains("light")).toBe(true);

    act(() => root.unmount());
  });

  it("enables block controls in the default feature set", () => {
    expect(resolveMiraEditorFeatures()[MiraFeature.BlockControls]).toBe(true);
  });

  it("renders the default toolbar with custom React actions", () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    const run = vi.fn();

    act(() => {
      root.render(
        <MiraEditorToolbar
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
        <MiraEditorToolbar
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
          <MiraEditorToolbar mode={mode} onModeChange={setMode} />
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

  it("renders and executes framework-neutral extension toolbar commands", () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    const run = vi.fn((context: MiraExtensionRuntimeContext) => {
      context.insertMarkdown("React extension command");
    });

    act(() => {
      root.render(
        <MiraEditor
          extensions={[
            {
              name: "react-command-example",
              commands: [
                {
                  id: "insert-react-command",
                  label: "Insert React command",
                  run,
                },
              ],
              toolbarItems: [
                {
                  id: "insert-react-command",
                  label: "Insert React command",
                  command: "insert-react-command",
                  icon: "sparkles",
                },
              ],
              styles: [
                {
                  id: "react-command-style",
                  cssText: ".react-command { color: rebeccapurple; }",
                },
              ],
            },
          ]}
        />,
      );
    });

    act(() => {
      host
        .querySelector<HTMLButtonElement>('[aria-label="Insert React command"]')
        ?.click();
    });

    expect(run).toHaveBeenCalledTimes(1);
    expect(
      document.head.querySelector(
        '[data-mira-extension-style="id:react-command-style"]',
      ),
    ).toBeTruthy();

    act(() => {
      root.unmount();
    });
    expect(
      document.head.querySelector(
        '[data-mira-extension-style="id:react-command-style"]',
      ),
    ).toBeNull();
  });
});
