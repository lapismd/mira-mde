import { describe, expect, it } from "vitest";
import {
  getEditableMarkdownPreviewOffset,
  isEditableMarkdownPreviewInteractiveTarget,
  shouldActivateEditableMarkdownPreview,
  shouldReturnEditableMarkdownPreviewOnBlur,
} from "./behavior";

describe("editable Markdown preview behavior", () => {
  it("accepts a plain primary click and reads the nearest source offset", () => {
    const block = document.createElement("p");
    block.dataset.offset = "24";
    const text = document.createElement("span");
    block.append(text);
    const event = new MouseEvent("click", { button: 0, bubbles: true });
    text.dispatchEvent(event);

    expect(shouldActivateEditableMarkdownPreview(event)).toBe(true);
    expect(getEditableMarkdownPreviewOffset(event)).toBe(24);
  });

  it("ignores interactive descendants, modifiers, and non-primary clicks", () => {
    const button = document.createElement("button");
    const child = document.createElement("span");
    button.append(child);

    expect(isEditableMarkdownPreviewInteractiveTarget(child)).toBe(true);
    expect(
      shouldActivateEditableMarkdownPreview(
        new MouseEvent("click", { button: 0, ctrlKey: true }),
      ),
    ).toBe(false);

    const interactiveEvent = new MouseEvent("click", {
      button: 0,
      bubbles: true,
    });
    child.dispatchEvent(interactiveEvent);
    expect(shouldActivateEditableMarkdownPreview(interactiveEvent)).toBe(false);
    expect(
      shouldActivateEditableMarkdownPreview(
        new MouseEvent("click", { button: 1 }),
      ),
    ).toBe(false);
  });

  it("returns to preview only when focus leaves the editor", () => {
    const container = document.createElement("div");
    const inside = document.createElement("button");
    const outside = document.createElement("button");
    container.append(inside);

    expect(
      shouldReturnEditableMarkdownPreviewOnBlur(container, inside, inside),
    ).toBe(false);
    expect(
      shouldReturnEditableMarkdownPreviewOnBlur(container, outside, outside),
    ).toBe(true);
  });
});
