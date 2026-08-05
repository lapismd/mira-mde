import { EditorView, WidgetType } from "@codemirror/view";
import { mount, unmount } from "svelte";
import type { MiraResolvedListCallout } from "@lapismd/mira/extensions";
import ListCalloutControl from "../../../../preview/components/list-callout-control.svelte";

type ListCalloutWidgetConfig = {
  from: number;
  to: number;
  removeTo: number;
  callout: MiraResolvedListCallout;
  callouts: readonly MiraResolvedListCallout[];
};

const listCalloutMounts = new WeakMap<HTMLElement, Record<string, unknown>>();

export class ListCalloutWidget extends WidgetType {
  constructor(private readonly config: ListCalloutWidgetConfig) {
    super();
  }

  override eq(other: ListCalloutWidget): boolean {
    return (
      this.config.from === other.config.from &&
      this.config.to === other.config.to &&
      this.config.removeTo === other.config.removeTo &&
      equalCallouts(this.config.callout, other.config.callout) &&
      this.config.callouts.length === other.config.callouts.length &&
      this.config.callouts.every((callout, index) =>
        equalCallouts(callout, other.config.callouts[index]),
      )
    );
  }

  override toDOM(view: EditorView): HTMLElement {
    const host = document.createElement("span");
    host.className = "mira-list-callout-widget";

    const component = mount(ListCalloutControl, {
      target: host,
      props: {
        callout: this.config.callout,
        callouts: this.config.callouts,
        onCalloutChange: (char: string | null) => {
          view.dispatch({
            changes: {
              from: this.config.from,
              to: char === null ? this.config.removeTo : this.config.to,
              insert: char ?? "",
            },
          });
        },
      },
    });
    listCalloutMounts.set(host, component);

    return host;
  }

  override destroy(dom: HTMLElement): void {
    const component = listCalloutMounts.get(dom);
    if (component) {
      void unmount(component);
      listCalloutMounts.delete(dom);
    }
  }

  override ignoreEvent(): boolean {
    return true;
  }
}

function equalCallouts(
  left: MiraResolvedListCallout,
  right: MiraResolvedListCallout | undefined,
): boolean {
  return Boolean(
    right &&
    left.char === right.char &&
    left.color === right.color &&
    left.icon === right.icon &&
    left.renderMarker === right.renderMarker,
  );
}
