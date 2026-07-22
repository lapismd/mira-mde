/**
 * Storybook 10.5 instruments `HTMLElement.prototype.focus` with an accessor whose
 * getter touches `this.ownerDocument`. React Aria (via addon-docs blocks) reads
 * `HTMLElement.prototype.focus` to wrap it, which invokes that getter with
 * `this === HTMLElement.prototype` and throws `TypeError: Illegal invocation`
 * on the first Docs-page load.
 *
 * Upstream: https://github.com/storybookjs/storybook/issues/35503
 * Remove this once Storybook ships a guarded getter (e.g. PR #35528).
 */
export function installFocusPrototypeGuard(): void {
  if (typeof HTMLElement === "undefined" || typeof document === "undefined") {
    return;
  }

  const wrapIfNeeded = (): boolean => {
    const desc = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "focus",
    );
    if (!desc || typeof desc.get !== "function") return false;

    const getter = desc.get as (() => typeof HTMLElement.prototype.focus) & {
      __uiFocusPrototypeGuard?: boolean;
    };
    if (getter.__uiFocusPrototypeGuard) return true;

    // Only wrap Storybook's accessor form (get/set), not a native data property.
    if (typeof desc.set !== "function") return false;

    let sampleFocus: typeof HTMLElement.prototype.focus;
    try {
      sampleFocus = getter.call(document.createElement("div"));
    } catch {
      return false;
    }

    const safeGet = function (
      this: HTMLElement,
    ): typeof HTMLElement.prototype.focus {
      if (this === HTMLElement.prototype || !(this instanceof Element)) {
        return sampleFocus;
      }
      try {
        return getter.call(this);
      } catch {
        return sampleFocus;
      }
    };
    safeGet.__uiFocusPrototypeGuard = true;

    Object.defineProperty(HTMLElement.prototype, "focus", {
      configurable: true,
      enumerable: desc.enumerable ?? false,
      get: safeGet,
      set: desc.set,
    });
    return true;
  };

  if (wrapIfNeeded()) return;

  // Storybook installs the accessor from enhanceContext; retry briefly.
  const started = Date.now();
  const timer = setInterval(() => {
    if (wrapIfNeeded() || Date.now() - started > 10_000) {
      clearInterval(timer);
    }
  }, 0);
}
