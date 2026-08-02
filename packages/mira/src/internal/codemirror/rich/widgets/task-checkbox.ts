import { EditorView, WidgetType } from "@codemirror/view";
import type { MiraRichEditorOptions } from "../types";

export class TaskCheckboxWidget extends WidgetType {
  constructor(
    private readonly config: {
      from: number;
      value: string;
      checked: boolean;
      options: MiraRichEditorOptions;
    },
  ) {
    super();
  }

  override eq(other: TaskCheckboxWidget): boolean {
    return (
      this.config.from === other.config.from &&
      this.config.value === other.config.value &&
      this.config.checked === other.config.checked
    );
  }

  override toDOM(view: EditorView): HTMLElement {
    const label = document.createElement("label");
    label.className = "task-list-label";
    label.dataset.task = this.config.value;

    const input = document.createElement("input");
    input.type = "checkbox";
    input.className =
      "task-list-item-checkbox mira-task-checkbox cm-task-checkbox";
    input.dataset.task = this.config.value;
    input.checked = this.config.checked;
    input.setAttribute("aria-label", "Toggle task");
    input.addEventListener("change", () => {
      const replacement = input.checked ? "x" : " ";
      view.dispatch({
        changes: {
          from: this.config.from + 1,
          to: this.config.from + 2,
          insert: replacement,
        },
      });
    });
    label.append(input);
    return label;
  }

  override ignoreEvent(): boolean {
    return true;
  }
}
