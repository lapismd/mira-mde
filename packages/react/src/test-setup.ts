declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

class ResizeObserverMock {
  disconnect(): void {
    return undefined;
  }

  observe(): void {
    return undefined;
  }

  unobserve(): void {
    return undefined;
  }
}

globalThis.ResizeObserver ??= ResizeObserverMock;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function emptyDomRect(): DOMRect {
  return {
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect;
}

function emptyDomRectList(): DOMRectList {
  return {
    length: 0,
    item: () => null,
    [Symbol.iterator]: function* iterator() {},
  } as DOMRectList;
}

if (typeof Range !== "undefined") {
  Range.prototype.getClientRects ??= emptyDomRectList;
  Range.prototype.getBoundingClientRect ??= emptyDomRect;
}

export {};
