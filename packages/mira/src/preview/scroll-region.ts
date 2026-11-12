/** Give an overflowing reading surface its own keyboard scrolling target. */
export function accessibleScrollRegion(element: HTMLElement, name: string) {
  const view = element.ownerDocument.defaultView!;
  let label = name;
  let active = true;
  const measure = () => {
    if (!active) return;
    const scrolls =
      element.scrollHeight > element.clientHeight + 1 ||
      element.scrollWidth > element.clientWidth + 1;
    if (scrolls) {
      element.setAttribute("tabindex", "0");
      element.setAttribute("role", "region");
      element.setAttribute("aria-label", label);
    } else {
      element.removeAttribute("tabindex");
      element.removeAttribute("role");
      element.removeAttribute("aria-label");
    }
  };
  const resize =
    typeof view.ResizeObserver === "function"
      ? new view.ResizeObserver(measure)
      : null;
  resize?.observe(element);
  let content: Element | null = null;
  const changed = () => {
    if (content !== element.firstElementChild) {
      if (content) resize?.unobserve(content);
      content = element.firstElementChild;
      if (content) resize?.observe(content);
    }
    measure();
  };
  const mutations = new view.MutationObserver(changed);
  mutations.observe(element, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  view.addEventListener("resize", measure);
  changed();
  return {
    update(nextName: string) {
      label = nextName;
      measure();
    },
    destroy() {
      active = false;
      mutations.disconnect();
      resize?.disconnect();
      view.removeEventListener("resize", measure);
    },
  };
}
