import { mount, tick, unmount } from "svelte";
import { describe, expect, it, vi } from "vitest";
import {
  defineMiraExtension,
  type MiraFileAdapter,
} from "@lapismd/mira/extensions";
import FileEmbed from "./file-embed.svelte";
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
