import { tick } from "svelte";
import { mount, unmount } from "svelte";
import BoldIcon from "@lucide/svelte/icons/bold";
import { describe, expect, it, vi } from "vitest";
import MiraEditorToolbar from "./mira-editor-toolbar.svelte";
import {
  MiraFeature,
  type MiraEditorToolbarActionContext,
  type MiraFeatureFlags,
} from "./features";
import type { MiraEditorToolbarProps } from "./types";
import { MIRA_EDITOR_VERSION } from "./version";

const noInsertItems: MiraFeatureFlags = {
  [MiraFeature.Formatting]: false,
  [MiraFeature.Headings]: false,
  [MiraFeature.Lists]: false,
  [MiraFeature.Links]: false,
  [MiraFeature.Images]: false,
  [MiraFeature.Tables]: false,
  [MiraFeature.GridTables]: false,
  [MiraFeature.Code]: false,
  [MiraFeature.Math]: false,
  [MiraFeature.Mermaid]: false,
};

async function renderToolbar(props: Partial<MiraEditorToolbarProps> = {}) {
  const target = document.createElement("div");
  document.body.append(target);
  const component = mount(MiraEditorToolbar, {
    target,
    props,
  });

  await tick();

  return {
    target,
    separators() {
      return target.querySelectorAll(".mira-editor__separator");
    },
    destroy() {
      unmount(component);
      target.remove();
    },
  };
}

function toolbarAction(id: string) {
  return {
    id,
    label: id,
    icon: BoldIcon,
    run: () => undefined,
  };
}

function actionContext(
  overrides: Partial<MiraEditorToolbarActionContext> = {},
): MiraEditorToolbarActionContext {
  return {
    value: "word",
    mode: "source",
    readonly: false,
    focus: () => undefined,
    getMarkdown: () => "word",
    getMode: () => "source",
    getSelection: () => null,
    insertMarkdown: () => undefined,
    setMarkdown: () => undefined,
    setMode: () => undefined,
    setReadonly: () => undefined,
    setSelection: () => undefined,
    ...overrides,
  };
}

describe("default Markdown toolbar actions", () => {
  it("delegates smart actions through an integrated editor context", async () => {
    const applyMarkdownAction = vi.fn(() => true);
    const insertMarkdown = vi.fn();
    const toolbar = await renderToolbar({
      context: actionContext({ applyMarkdownAction, insertMarkdown }),
      featureConfigs: {
        [MiraFeature.Toolbar]: {
          items: ["heading", "strikethrough", "inlineCode", "numberedList"],
        },
      },
    });

    toolbar.target
      .querySelector<HTMLButtonElement>('[aria-label="Strikethrough"]')
      ?.click();

    expect(applyMarkdownAction).toHaveBeenCalledWith("strikethrough");
    expect(insertMarkdown).not.toHaveBeenCalled();
    expect(
      toolbar.target.querySelector('[aria-label="Inline code"]'),
    ).toBeTruthy();
    expect(
      toolbar.target.querySelector('[aria-label="Numbered list"]'),
    ).toBeTruthy();
    toolbar.destroy();
  });

  it("retains template insertion for a standalone toolbar", async () => {
    const onInsertMarkdown = vi.fn();
    const toolbar = await renderToolbar({
      onInsertMarkdown,
      featureConfigs: {
        [MiraFeature.Toolbar]: { items: ["bold"] },
      },
    });

    toolbar.target
      .querySelector<HTMLButtonElement>('[aria-label="Bold"]')
      ?.click();
    expect(onInsertMarkdown).toHaveBeenCalledWith("**strong**");
    toolbar.destroy();
  });

  it("disables built-in actions in readonly and reading modes", async () => {
    const preview = await renderToolbar({ mode: "preview" });
    expect(
      preview.target.querySelector<HTMLButtonElement>('[aria-label="Bold"]')
        ?.disabled,
    ).toBe(true);
    preview.destroy();

    const readonly = await renderToolbar({ readonly: true });
    expect(
      readonly.target.querySelector<HTMLButtonElement>('[aria-label="Bold"]')
        ?.disabled,
    ).toBe(true);
    readonly.destroy();
  });
});

describe("default toolbar separators", () => {
  it("does not render separators when only view controls are visible", async () => {
    const toolbar = await renderToolbar({ features: noInsertItems });

    expect(toolbar.separators()).toHaveLength(0);

    toolbar.destroy();
  });

  it("renders one separator between leading content and view controls", async () => {
    const toolbar = await renderToolbar({
      features: noInsertItems,
      toolbars: [
        {
          id: "start",
          items: [toolbarAction("start-action")],
        },
      ],
    });

    expect(toolbar.separators()).toHaveLength(1);

    toolbar.destroy();
  });

  it("ignores empty custom toolbar groups for separator placement", async () => {
    const toolbar = await renderToolbar({
      features: noInsertItems,
      toolbars: [
        { id: "empty-start", items: [] },
        { id: "empty-end", align: "end", items: [] },
      ],
    });

    expect(toolbar.separators()).toHaveLength(0);

    toolbar.destroy();
  });

  it("does not duplicate separators between end groups and view controls", async () => {
    const toolbar = await renderToolbar({
      features: noInsertItems,
      toolbars: [
        {
          id: "first-end",
          align: "end",
          items: [toolbarAction("first-end-action")],
        },
        {
          id: "second-end",
          align: "end",
          items: [toolbarAction("second-end-action")],
        },
      ],
    });

    expect(toolbar.separators()).toHaveLength(2);

    toolbar.destroy();
  });
});

describe("toolbar About dialog", () => {
  it("opens the package-branded version dialog from View options", async () => {
    const toolbar = await renderToolbar({ features: noInsertItems });

    toolbar.target
      .querySelector<HTMLButtonElement>('[aria-label="View options"]')
      ?.click();
    await tick();

    const aboutItem = Array.from(
      document.body.querySelectorAll<HTMLElement>('[role="menuitem"]'),
    ).find((item) => item.textContent?.includes("About Mira"));
    expect(aboutItem).toBeTruthy();

    aboutItem?.click();
    await tick();

    const dialog = document.body.querySelector<HTMLElement>('[role="dialog"]');
    expect(dialog?.getAttribute("aria-labelledby")).toBeTruthy();
    expect(dialog?.textContent).toContain("About Mira");
    expect(dialog?.textContent).toContain(`Version ${MIRA_EDITOR_VERSION}`);
    expect(
      dialog?.querySelector<HTMLImageElement>('img[alt="Mira MDE logo"]'),
    ).toBeTruthy();

    dialog
      ?.querySelector<HTMLButtonElement>('[data-slot="dialog-close"]')
      ?.click();
    await tick();
    expect(dialog?.dataset.state).toBe("closed");
    await new Promise((resolve) => window.setTimeout(resolve, 250));
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();

    toolbar.destroy();
  });
});
