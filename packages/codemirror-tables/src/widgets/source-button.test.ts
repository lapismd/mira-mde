import { describe, expect, it, vi } from "vitest";
import { createSourceButton } from "./source-button";

describe("table source button", () => {
  it("calls the source callback from the widget affordance", () => {
    const onSource = vi.fn();
    const button = createSourceButton(onSource);

    button.click();

    expect(button.className).toContain("mira-table-widget__source-toggle");
    expect(onSource).toHaveBeenCalledTimes(1);
  });
});
