import { unmount } from "svelte";

const mounts = new WeakMap<HTMLElement, Record<string, unknown>>();

export function registerTableWidgetMount(
  root: HTMLElement,
  component: Record<string, unknown>,
): void {
  mounts.set(root, component);
}

/** Called by the owning CodeMirror widget; safe after repeated destruction. */
export function destroyTableWidget(root: HTMLElement): void {
  const component = mounts.get(root);
  if (!component) return;
  mounts.delete(root);
  void unmount(component);
}
