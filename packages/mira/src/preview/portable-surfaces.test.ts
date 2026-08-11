import { mount, tick, unmount } from "svelte";
import { describe, expect, it, vi } from "vitest";
import {
  defineMiraExtension,
  doodleDividersExtension,
  type MiraFileAdapter,
} from "@lapismd/mira/extensions";
import FileEmbed from "./file-embed.svelte";
import EditableMarkdownPreview from "./editable-markdown-preview.svelte";
import MarkdownEmbed from "./markdown-embed.svelte";
import MarkdownPreview from "./markdown-preview.svelte";
import NoteLink from "./note-link.svelte";

const fileAdapter: MiraFileAdapter = {
  resolveLink(target) {
    return {
      path: target.path,
      name: target.path.replace(/\.md$/u, ""),
      kind: "markdown",
    };
  },
  readMarkdown() {
    return "# Embedded note\n\nPortable content.";
  },
};

async function settle(): Promise<void> {
  await Promise.resolve();
  await tick();
  await Promise.resolve();
  await tick();
}

describe("portable preview surfaces", () => {
  it("keeps adapters without writeMarkdown read-only", async () => {
    const target = document.createElement("div");
    const component = mount(EditableMarkdownPreview, {
      target,
      props: {
        file: {
          kind: "markdown",
          name: "Portable",
          path: "notes/portable.md",
        },
        fileAdapter,
      },
    });
    await settle();

    target
      .querySelector<HTMLElement>(
        '[data-editable-markdown-preview] [role="button"]',
      )
      ?.click();
    await settle();
    expect(target.querySelector("[data-editable-markdown-editor]")).toBeNull();
    expect(
      target
        .querySelector("[data-editable-markdown-preview]")
        ?.getAttribute("data-editing"),
    ).toBe("false");
    await unmount(component);
  });

  it("enters a live-preview editor only for writable Markdown adapters", async () => {
    const target = document.createElement("div");
    const component = mount(EditableMarkdownPreview, {
      target,
      props: {
        file: {
          kind: "markdown",
          name: "Portable",
          path: "notes/portable.md",
        },
        fileAdapter: { ...fileAdapter, writeMarkdown: vi.fn() },
      },
    });
    await settle();

    target
      .querySelector<HTMLElement>(
        '[data-editable-markdown-preview] [role="button"]',
      )
      ?.click();
    await settle();
    expect(
      target.querySelector("[data-editable-markdown-editor]"),
    ).toBeTruthy();
    expect(target.querySelector(".cm-editor")).toBeTruthy();
    expect(target.querySelector(".cm-activeLine")?.textContent).toContain(
      "Embedded note",
    );
    await unmount(component);
  });

  it("exits through the public editable-preview contract", async () => {
    const target = document.createElement("div");
    const writeMarkdown = vi.fn();
    const component = mount(EditableMarkdownPreview, {
      target,
      props: {
        file: {
          kind: "markdown",
          name: "Portable",
          path: "notes/portable.md",
        },
        fileAdapter: { ...fileAdapter, writeMarkdown },
      },
    });
    await settle();

    target
      .querySelector<HTMLElement>(
        '[data-editable-markdown-preview] [role="button"]',
      )
      ?.click();
    await settle();
    expect(await component.exit()).toBe(true);
    expect(target.querySelector("[data-editable-markdown-editor]")).toBeNull();
    await unmount(component);
  });

  it("renders standalone Markdown embeds", async () => {
    const target = document.createElement("div");
    const component = mount(MarkdownEmbed, {
      target,
      props: {
        value: "## Embedded Markdown",
      },
    });
    await settle();

    expect(target.querySelector("[data-markdown-embed]")).toBeTruthy();
    expect(target.querySelector("h2")?.textContent).toContain(
      "Embedded Markdown",
    );
    await unmount(component);
  });

  it("renders adapter-backed file embeds and note links", async () => {
    const embedTarget = document.createElement("div");
    const linkTarget = document.createElement("div");
    const embed = mount(FileEmbed, {
      target: embedTarget,
      props: {
        id: "notes/portable.md#Embedded note",
        label: "Portable section",
        fileAdapter,
      },
    });
    const link = mount(NoteLink, {
      target: linkTarget,
      props: {
        id: "notes/portable.md",
        text: "Portable note",
        fileAdapter,
      },
    });
    await settle();

    expect(
      embedTarget.querySelector("[data-embed-fragment='heading']"),
    ).toBeTruthy();
    expect(embedTarget.textContent).toContain("Embedded note");
    expect(
      linkTarget.querySelector("[data-link-preview-path='notes/portable.md']"),
    ).toBeTruthy();
    expect(linkTarget.textContent).toContain("Portable note");
    await unmount(embed);
    await unmount(link);
  });

  it("does not repeat an image embed caption as its alternative text", async () => {
    const target = document.createElement("div");
    const imageAdapter: MiraFileAdapter = {
      resolveLink() {
        return {
          kind: "image",
          name: "Service topology",
          path: "assets/service-topology.svg",
        };
      },
      readAssetUrl() {
        return "/service-topology.svg";
      },
    };
    const component = mount(FileEmbed, {
      target,
      props: {
        id: "assets/service-topology.svg",
        label: "Service topology",
        fileAdapter: imageAdapter,
      },
    });
    await settle();

    expect(target.querySelector("figcaption")?.textContent).toBe(
      "Service topology",
    );
    expect(target.querySelector<HTMLImageElement>("img")?.alt).toBe("");
    await unmount(component);
  });

  it("loads internal-link preview content only after interaction", async () => {
    const target = document.createElement("div");
    target.dataset.miraTheme = "obsidian company-brand";
    target.dataset.miraColorMode = "dark";
    document.body.append(target);
    const readMarkdown = vi.fn(() => "[[notes/portable.md|Nested link]]");
    const component = mount(NoteLink, {
      target,
      props: {
        id: "notes/portable.md",
        text: "Portable note",
        fileAdapter: { ...fileAdapter, readMarkdown },
      },
    });
    await settle();

    expect(readMarkdown).not.toHaveBeenCalled();
    expect(target.querySelectorAll("[data-link-preview-trigger]")).toHaveLength(
      1,
    );
    expect(
      target
        .querySelector("[data-link-preview-trigger]")
        ?.getAttribute("aria-haspopup"),
    ).toBe("dialog");

    target
      .querySelector<HTMLElement>("[data-link-preview-trigger]")
      ?.dispatchEvent(new PointerEvent("pointerenter"));
    await settle();

    expect(readMarkdown).toHaveBeenCalledOnce();
    await new Promise((resolve) => setTimeout(resolve, 750));
    await settle();

    const preview = document.body.querySelector<HTMLElement>(
      "[data-mira-link-preview-content][data-link-preview-path='notes/portable.md']",
    );
    expect(preview).not.toBeNull();
    expect(target.contains(preview)).toBe(false);
    expect(preview?.dataset.miraTheme).toBe("obsidian company-brand");
    expect(preview?.dataset.miraColorMode).toBe("dark");
    expect(
      preview?.querySelectorAll("[data-link-preview-trigger]"),
    ).toHaveLength(1);
    await unmount(component);
    target.remove();
  });

  it("keeps a writable internal-link card open while its preview is editing", async () => {
    const target = document.createElement("div");
    const outside = document.createElement("button");
    document.body.append(target);
    document.body.append(outside);
    const component = mount(NoteLink, {
      target,
      props: {
        id: "notes/portable.md",
        text: "Portable note",
        fileAdapter: { ...fileAdapter, writeMarkdown: vi.fn() },
      },
    });
    await settle();

    const trigger = target.querySelector<HTMLElement>(
      "[data-link-preview-trigger]",
    );
    trigger?.dispatchEvent(new PointerEvent("pointerenter"));
    await new Promise((resolve) => setTimeout(resolve, 750));
    await settle();

    const selector =
      "[data-mira-link-preview-content][data-link-preview-path='notes/portable.md']";
    const preview = document.body.querySelector<HTMLElement>(selector);
    preview?.querySelector("p")?.click();
    await settle();
    expect(
      preview?.querySelector("[data-editable-markdown-editor]"),
    ).toBeTruthy();

    trigger?.dispatchEvent(new PointerEvent("pointerleave"));
    await new Promise((resolve) => setTimeout(resolve, 350));
    await settle();
    expect(document.body.querySelector(selector)).toBe(preview);
    expect(preview?.querySelector('[data-editing="true"]')).toBeTruthy();

    outside.focus();
    await settle();
    expect(document.body.querySelector(selector)).toBe(preview);
    expect(preview?.querySelector('[data-editing="true"]')).toBeTruthy();

    outside.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        composed: true,
        pointerType: "mouse",
        button: 0,
        isPrimary: true,
        clientX: 100,
        clientY: 100,
      }),
    );
    await vi.waitFor(() => {
      expect(document.body.querySelector(selector)).toBeNull();
    });

    await unmount(component);
    target.remove();
    outside.remove();
  });

  it("falls back to portable Markdown when a custom embed renderer declines", async () => {
    const target = document.createElement("div");
    const renderEmbed = vi.fn(() => false as const);
    const component = mount(FileEmbed, {
      target,
      props: {
        id: "notes/portable.md",
        fileAdapter: { ...fileAdapter, renderEmbed },
      },
    });
    await settle();

    expect(renderEmbed).toHaveBeenCalledOnce();
    expect(target.querySelector("[data-markdown-embed]")).toBeTruthy();
    expect(target.textContent).toContain("Portable content");
    await unmount(component);
  });

  it("runs and cleans up extension postprocessors", async () => {
    const cleanup = vi.fn();
    const target = document.createElement("div");
    const component = mount(MarkdownPreview, {
      target,
      props: {
        value: "Portable diagnostics.",
        extensions: [
          defineMiraExtension({
            name: "diagnostics",
            postProcessors: [
              (element) => {
                if (element.tagName === "P") {
                  element.dataset.diagnostic = "checked";
                }
                return cleanup;
              },
            ],
          }),
        ],
      },
    });
    await settle();

    expect(target.querySelector("p")?.dataset.diagnostic).toBe("checked");
    await unmount(component);
    expect(cleanup).toHaveBeenCalled();
  });

  it("renders seeded doodle dividers while retaining bare native rules", async () => {
    const target = document.createElement("div");
    const component = mount(MarkdownPreview, {
      target,
      props: {
        value: `<!-- mira-divider:v1:4f32a91c -->
---

---`,
        extensions: [doodleDividersExtension()],
      },
    });
    await settle();

    const rules = target.querySelectorAll("hr");
    expect(rules).toHaveLength(2);
    expect(rules[0]?.dataset.miraDoodleDivider).toBe("true");
    expect(rules[1]?.dataset.miraDoodleDivider).toBeUndefined();
    expect(target.querySelectorAll(".mira-doodle-divider")).toHaveLength(1);
    expect(
      target.querySelector(".mira-doodle-divider")?.getAttribute("aria-hidden"),
    ).toBe("true");

    await unmount(component);
  });

  it("keeps rendered frontmatter chrome locally collapsible", async () => {
    const target = document.createElement("div");
    const component = mount(MarkdownPreview, {
      target,
      props: {
        value: "---\ntitle: Portable\n---\n\n# Note",
      },
    });
    await settle();

    const collapse = target.querySelector<HTMLButtonElement>(
      ".md-frontmatter__trigger",
    );
    expect(collapse?.getAttribute("aria-label")).toBe("Collapse properties");
    expect(target.querySelector(".md-frontmatter__content")).not.toBeNull();

    collapse?.click();
    await settle();
    expect(collapse?.getAttribute("aria-label")).toBe("Expand properties");
    expect(collapse?.getAttribute("aria-expanded")).toBe("false");
    expect(target.querySelector(".md-frontmatter__content")).toBeNull();

    collapse?.click();
    await settle();
    expect(collapse?.getAttribute("aria-label")).toBe("Collapse properties");
    expect(collapse?.getAttribute("aria-expanded")).toBe("true");
    expect(target.querySelector(".md-frontmatter__content")).not.toBeNull();

    await unmount(component);
  });

  it("keeps read-only list callouts passive and makes editable markers selectable", async () => {
    const readOnlyTarget = document.createElement("div");
    const editableTarget = document.createElement("div");
    document.body.append(readOnlyTarget, editableTarget);
    const readOnly = mount(MarkdownPreview, {
      target: readOnlyTarget,
      props: {
        value: "- & Highlighted",
      },
    });
    const editable = mount(MarkdownPreview, {
      target: editableTarget,
      props: {
        value: "- & Highlighted",
        onChange: vi.fn(),
      },
    });
    await settle();

    expect(
      readOnlyTarget.querySelector("[data-list-callout-marker]"),
    ).not.toBeNull();
    expect(
      readOnlyTarget.querySelector(".mira-list-callout-trigger"),
    ).toBeNull();

    const editableTrigger = editableTarget.querySelector<HTMLElement>(
      ".mira-list-callout-trigger",
    );
    expect(editableTrigger?.tagName).toBe("BUTTON");
    expect(editableTrigger?.getAttribute("aria-label")).toBe(
      "Change list highlight (&)",
    );

    await unmount(readOnly);
    await unmount(editable);
    readOnlyTarget.remove();
    editableTarget.remove();
  });
});
