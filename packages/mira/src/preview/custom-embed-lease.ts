import type { MiraFileAdapter } from "../extensions";

/** Own one custom renderer, including activation that outlives its surface. */
export function createCustomEmbedLease(
  render: NonNullable<MiraFileAdapter["renderEmbed"]>,
  target: Parameters<NonNullable<MiraFileAdapter["renderEmbed"]>>[0],
  element: HTMLElement,
  resolved: (handled: boolean) => void,
  failed: (error: unknown) => void,
): () => void {
  const controller = new AbortController();
  let disposed = false;
  let cleanup: (() => void) | undefined;
  const settle = (result: false | void | (() => void)) => {
    if (disposed) {
      if (typeof result === "function") result();
      return;
    }
    cleanup = typeof result === "function" ? result : undefined;
    resolved(result !== false);
  };
  const reject = (error: unknown) => {
    if (disposed) return;
    resolved(false);
    failed(error);
  };
  try {
    const result = render(target, element, { signal: controller.signal });
    if (result instanceof Promise || (result && "then" in result)) {
      resolved(true);
      void Promise.resolve(result).then(settle, reject);
    } else settle(result);
  } catch (error) {
    reject(error);
  }
  return () => {
    if (disposed) return;
    disposed = true;
    controller.abort();
    cleanup?.();
    element.replaceChildren();
  };
}
