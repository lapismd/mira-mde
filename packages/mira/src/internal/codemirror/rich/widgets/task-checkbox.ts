import { EditorView, WidgetType } from "@codemirror/view";
import { mount, unmount } from "svelte";
import TaskCheckboxControl from "../../../../preview/components/task-checkbox-control.svelte";

const taskCheckboxMounts = new WeakMap<HTMLElement, Record<string, unknown>>();

export class TaskCheckboxWidget extends WidgetType {
  constructor(
    private readonly config: {
      from: number;
      value: string;
      checked: boolean;
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
    const label = document.createElement("span");
    label.className = "task-list-label";
    label.dataset.task = this.config.value;

    const replaceTaskMarker = (replacement: string): void => {
      view.dispatch({
        changes: {
          from: this.config.from + 1,
          to: this.config.from + 2,
          insert: replacement,
        },
      });
    };
    const component = mount(TaskCheckboxControl, {
      target: label,
      props: {
        checkboxClass: "mira-task-checkbox cm-task-checkbox",
        task: this.config.value,
        checked: this.config.checked,
        onCheckedChange: (checked: boolean) => {
          replaceTaskMarker(checked ? "x" : " ");
        },
        onTaskChange: replaceTaskMarker,
      },
    });
    taskCheckboxMounts.set(label, component);

    return label;
  }

  override destroy(dom: HTMLElement): void {
    const component = taskCheckboxMounts.get(dom);
    if (component) {
      void unmount(component);
      taskCheckboxMounts.delete(dom);
    }
  }

  override ignoreEvent(): boolean {
    return true;
  }
}
